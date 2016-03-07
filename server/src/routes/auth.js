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

    .post('Facebook Log-in', '/fblogin',
        auth.facebookLogin(),
        ctx => {
            return ctx.state.user.generateJWT().then(token => {
                ctx.response.status = 200;
                ctx.body = {JWT: token};
            });
        }
    )
    .post('Sign up', '/signup',
        validator.auth.signup(),
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
                stripe.addUser(user); // Not using return to allow it to process in background
            }).catch(err => {
                if (err.code === 11000) {
                    // Duplicate key error -- existed email
                    ctx.throw(400, "Email existed");
                } else {
                    throw err;
                }
            });
        }
    )
    .post('Sign out', '/logout',
        auth.authenticate(),
        ctx => {
            let session = ctx.state.session;

            return session.remove().then(session => {
                ctx.status = 200;
            });
        }
    );