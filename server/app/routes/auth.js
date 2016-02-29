"use strict";

var router = require('koa-router')();
var url = require('url');

var config = require('../config');
var db = require('../db');
var validator = require('../validators');
var mailer = require('../mailer');

var auth = require('../helpers/passport_auth');
var stripe = require('../helpers/stripe');

module.exports = router;

router.post('Log in', '/login', auth.login(), function (ctx) {
    return ctx.state.user.generateJWT().then(function (token) {
        ctx.response.status = 200;
        ctx.body = { JWT: token };
    });
}).post('Sign up', '/signup', validator.auth.signup(), function (ctx) {
    var user = new db.users({
        email: ctx.request.body.email.toLowerCase(),
        firstName: ctx.request.body.firstName,
        lastName: ctx.request.body.lastName,
        gender: ctx.request.body.gender
    });
    user.setPassword(ctx.request.body.password);
    return user.save().then(function (user) {
        ctx.response.status = 204;
        mailer.welcome(user.email, { name: user.firstName });
        stripe.addUser(user); // Not using return to allow it to process in background
    }).catch(function (err) {
        if (err.code === 11000) {
            // Duplicate key error -- existed email
            ctx.throw(400, "Email existed");
        } else {
            throw err;
        }
    });
}).post('Sign out', '/signout', auth.authenticate(), function (ctx) {
    var session = ctx.state.session;

    session.remove().exec().then(function (session) {
        ctx.status = 200;
    });
});