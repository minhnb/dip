"use strict";

var router = require('koa-router')();
var db = require('../db');

var auth = require('../helpers/passport_auth');
var validator = require('../helpers/input_validator');
var stripe = require('../helpers/stripe');

module.exports = router;

router.post('Log in', '/login', auth.login(), function (ctx) {
    return ctx.state.user.generateJWT().then(function (token) {
        ctx.response.status = 200;
        ctx.body = { JWT: token };
    });
}).post('Sign up', '/signup', validator({
    request: {
        body: {
            email: validator.isEmail(),
            password: validator.validatePassword,
            firstName: validator.trim(),
            lastName: validator.trim,
            gender: validator.isIn(['male', 'female', 'na'])
        }
    }
}), function (ctx) {
    var user = new db.users({
        email: ctx.request.body.email,
        firstName: ctx.request.body.firstName,
        lastName: ctx.request.body.lastName,
        gender: ctx.request.body.gender
    });
    user.setPassword(ctx.request.body.password);
    return user.save().then(function (user) {
        ctx.response.status = 204;
        return stripe.customers.create({
            email: user.email
        }).then(function (customer) {
            user.account.stripeId = customer.id;
            user.save();
        });
    }).catch(function (err) {
        if (err.code === 11000) {
            // Duplicate key error -- existed email
            ctx.body = "Email existed";
        }
        throw err;
    });
});