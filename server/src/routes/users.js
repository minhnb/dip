"use strict";

const router = require('koa-router')();
const db = require('../db');
const entities = require('../entities');

const auth = require('../helpers/passport_auth');
const validator = require('../helpers/input_validator');
const stripe = require('../helpers/stripe');

module.exports = router;

router
    .put('add user', '/', (ctx, next) => {
        // Why do we have a user-adding route here?
        let user_info = ctx.params.user;
        ctx.body = {user: ctx.request.body};
    })
    .get('get user', '/:username',
        auth.authenticate(['user:read']),
        ctx => {
            return new Promise((resolve, reject) => {
                if (ctx.params.username === 'me') {
                    resolve(ctx.state.user);
                } else {
                    resolve(db.users.findByEmail(ctx.params.username).exec());
                }
            }).then(user => {
                if (!user) {
                    //ctx.body = {user: null, error: 'Invalid user'};
                    ctx.response.status = 404;
                } else {
                    ctx.body = {user: entities.user(user, user._id.equals(ctx.state.user._id))};
                }
            });
        }
    )
    .post('update user', '/:username',
        auth.authenticate(['user:update']),
        validator({
            request: {
                body: {
                    user: {
                        email: validator.optional(validator.isEmail),
                        dob: validator.optional(validator.isDate()),
                        phone: validator.optional(validator.isNumeric()),
                        oldPassword: validator.optional(validator.validatePassword),
                        newPassword: validator.optional(validator.validatePassword)
                    }
                }
            }
        }),
        ctx => {
            if (ctx.params.username !== 'me') {
                let error = "Couldn't update other user's info";
                ctx.response.status = 401;
                ctx.body = error;
                throw new Error(error);
            }
            let postData = ctx.request.body.user,
                user = ctx.state.user;
            if (postData.gender !== undefined) {
                user.gender = postData.gender ? postData.gender.toLowerCase() : 'na';
            }
            if (postData.firstName !== undefined) {
                user.firstName = postData.firstName;
            }
            if (postData.lastName !== undefined) {
                user.lastName = postData.lastName;
            }
            if (postData.dob !== undefined) {
                user.dob = new Date(postData.dob);
            }
            if (postData.phone !== undefined) {
                user.phone = postData.phone;
            }
            if (postData.picture && postData.picture.url) {
                user.avatar.url = postData.picture.url;
                user.avatar.contentType = postData.picture.mediaType;
            }
            return user.save().then(() => {
                ctx.response.status = 204;
            }).catch(err => {
                ctx.response.status = 400;
                ctx.body = "Bad request";
                throw err;
            });
        }
    )
    .put('add payment', '/me/payment_methods',
        auth.authenticate(['user:updatePayment']),
        validator({
            request: {
                body: {
                    stripeToken: validator.required(true)
                }
            }
        }),
        ctx => {
            let token = ctx.request.body.stripeToken,
                user = ctx.state.user;
            return stripe.customers.createSource(ctx.state.user.account.stripeId, {
                source: token
            }).catch(err => {
                err.status = 500; // Which is the appropriate http code for stripe error?
                throw err;
            }).then(card => {
                var userCard = user.account.cards.create({
                    stripeToken: token,
                    brand: card.brand,
                    last4Digits: card.last4,
                    expMonth: card.exp_month,
                    expYear: card.exp_year,
                    cvcCheck: card.cvc_check,
                    country: card.country,
                    funding: card.funding
                });
                user.account.cards.push(userCard);
                user.save().then(() => {
                    ctx.response.status = 200;
                    ctx.body = {newCard: entities.creditCard(userCard)};
                });
            });
        }
    );
