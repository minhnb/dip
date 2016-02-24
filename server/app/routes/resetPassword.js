"use strict";

var router = require('koa-router')();
var url = require('url');

var config = require('../config');
var db = require('../db');
var validator = require('../validators');
var mailer = require('../mailer');

module.exports = router;

router.post('Request password reset', '/', validator.resetPassword.request(), function (ctx) {
    var email = ctx.request.body.email.toLowerCase();
    return db.users.findByEmail(email).exec().then(function (user) {
        // We don't let user know whether the email exists or not
        ctx.status = 204;
        if (user) {
            var token = new db.passwordToken({
                user: user,
                token: db.passwordToken.generateToken()
            });
            return token.save().then(function (token) {
                // Send email
                mailer.resetPassword(user.email, {
                    name: user.firstName || user.lastName || user.email,
                    link: url.format({
                        protocol: 'https',
                        host: config.baseUrl,
                        pathname: '/resetpassword',
                        query: {
                            token: token.token
                        }
                    })
                });
            });
        }
    });
}).put('Reset password', '/:token', validator.resetPassword.reset(), function (ctx) {
    var token = ctx.params.token,
        password = ctx.request.body.password;
    return db.passwordToken.findOne({ token: token }).populate('user').exec().then(function (token) {
        if (!token) {
            ctx.throw(404, 'Invalid or expired token');
        }
        // Check if token.user is valid first
        if (!token.user) {
            ctx.throw(404, 'Invalid user');
        }
        var user = token.user;
        user.setPassword(password);
        return user.save().then(function (user) {
            ctx.status = 204;
            token.remove();
        });
    });
});