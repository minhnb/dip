"use strict";

const router = require('koa-router')();
const db = require('../db');

const auth = require('../helpers/passport_auth');
const validator = require('../helpers/input_validator');
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
        })
    .post('Sign up', '/signup',
        validator({
            request: {
                body: {
                    email: validator.isEmail(),
                    password: validator.validatePassword,
                    firstName: validator.trim(),
                    lastName: validator.trim,
                    gender: validator.isIn(['male', 'female', 'na'])
                }
            }
        }),
        ctx => {
            var user = new db.users({
                email: ctx.request.body.email,
                firstName: ctx.request.body.firstName,
                lastName: ctx.request.body.lastName,
                gender: ctx.request.body.gender
            });
            user.setPassword(ctx.request.body.password);
            return user.save().then(user => {
                ctx.response.status = 204;
                return stripe.customers.create({
                    email: user.email
                }).then(customer => {
                    user.account.stripeId = customer.id;
                    user.save();
                });
            }).catch(err => {
                if (err.code === 11000) {
                    // Duplicate key error -- existed email
                    ctx.body = "Email existed";
                }
                throw err;
            });
        });