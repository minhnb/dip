"use strict";

const router = require('koa-router')();
const url = require('url');

const config = require('../config');
const db = require('../db');
const validator = require('../validators');
const mailer = require('../mailer');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

module.exports = router;

router.post('Request password reset', '/',
    validator.resetPassword.request(),
    ctx => {
        let email = ctx.request.body.email.toLowerCase();
        return db.users.findByEmail(email)
            .exec()
            .then(user => {
                // We don't let user know whether the email exists or not
                if (user) {
                    ctx.status = 204;
                    let token = new db.passwordToken({
                        user: user,
                        token: db.passwordToken.generateToken()
                    });
                    return token.save().then(token => {
                        // Send email
                        // mailer.resetPassword(user.email, {
                        //     name: user.firstName || user.lastName || user.email,
                        //     token: token.token,
                        //     link: url.format({
                        //         protocol: 'https',
                        //         host: config.baseUrl,
                        //         pathname: '/resetpassword',
                        //         query: {
                        //             token: token.token
                        //         }
                        //     })
                        // });
                        let userName = user.firstName || user.lastName || user.email;
                        mailer.resetPassword({
                            email: user.email,
                            name: userName
                        }, {
                            name: userName,
                            token: token.token,
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
                } else {
                    ctx.status = 400;
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
                    // ctx.throw(404, 'Invalid or expired token');
                    throw new DIPError(dipErrorDictionary.INVALID_OR_EXPIRED_TOKEN);
                }
                // Check if token.user is valid first
                if (!token.user) {
                    // ctx.throw(404, 'Invalid user');
                    throw new DIPError(dipErrorDictionary.USER_NOT_FOUND);
                }
                let user = token.user;
                user.setPassword(password);
                return user.save().then(user => {
                    ctx.status = 204;
                    token.remove();

                    // Send password-changed email
                    let userName = user.firstName || user.lastName || user.email;
                    mailer.passwordChanged({
                        email: user.email,
                        name: userName
                    }, {
                        name: userName
                    });
                });
            });
    }
);