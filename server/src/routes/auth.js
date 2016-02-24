"use strict";

const router = require('koa-router')();
const url = require('url');

const config = require('../config');
const db = require('../db');
const validator = require('../validators');
const mailer = require('../mailer');

const auth = require('../helpers/passport_auth');
const stripe = require('../helpers/stripe');

module.exports = router;

router
    .post('Log in', '/login',
        auth.login(),
        ctx => {
            return ctx.state.user.generateJWT().then(token => {
                ctx.response.status = 200;
                ctx.body = {JWT: token};
            });
        }
    )
    .post('Sign up', '/signup',
        validator.userSignup(),
        ctx => {
            var user = new db.users({
                email: ctx.request.body.email.toLowerCase(),
                firstName: ctx.request.body.firstName,
                lastName: ctx.request.body.lastName,
                gender: ctx.request.body.gender
            });
            user.setPassword(ctx.request.body.password);
            return user.save().then(user => {
                ctx.response.status = 204;
                mailer.welcome(user.email, {name: user.firstName});
                return stripe.customers.create({
                    email: user.email
                }).then(customer => {
                    user.account.stripeId = customer.id;
                    user.save();
                });
            }).catch(err => {
                if (err.code === 11000) {
                    // Duplicate key error -- existed email
                    ctx.throw(400, "Email existed");
                } else {
                    throw err;
                }
            });
        }
    );