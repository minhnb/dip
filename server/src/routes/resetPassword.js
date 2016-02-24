"use strict";

const router = require('koa-router')();
const url = require('url');

const config = require('../config');
const db = require('../db');
const validator = require('../validators');
const email = require('../email');

module.exports = router;

router.post('Request password reset', '/',
    validator.resetPassword.request(),
    ctx => {
        let email = ctx.request.body.email.toLowerCase();
        return db.users.findByEmail(email)
            .exec()
            .then(user => {
                // We don't let user know whether the email exists or not
                ctx.status = 204;
                if (user) {
                    let token = new db.passwordToken({
                        user: user,
                        token: db.passwordToken.generateToken()
                    });
                    return token.save().then(token => {
                        // Send email
                        email.resetPassword(user.email, {
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
    }
)
.put('Reset password', '/:token',
    validator.resetPassword.reset(),
    ctx => {
        let token = ctx.params.token,
            password = ctx.request.body.password;
        return db.passwordToken
            .findOne({token: token})
            .populate('user')
            .exec()
            .then(token => {
                if (!token) {
                    ctx.throw(404, 'Invalid or expired token');
                }
                // Check if token.user is valid first
                if (!token.user) {
                    ctx.throw(404, 'Invalid user');
                }
                let user = token.user;
                user.setPassword(password);
                return user.save().then(user => {
                    ctx.status = 204;
                    token.remove();
                });
            });
    }
);