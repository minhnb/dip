"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');

const db = require('../db');
const entities = require('../entities');
const validator = require('../input_validator');

module.exports = router;

router.put('add user', '/', (ctx, next) => {
    // Why do we have a user-adding route here?
    let user_info = ctx.params.user;
    ctx.body = { user: ctx.request.body };
}).get('get user', '/:username', auth.authenticate(['user:read']), ctx => {
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
            ctx.body = { user: entities.user(user, user._id.equals(ctx.state.user._id)) };
        }
    });
}).post('update user', '/:username', auth.authenticate(['user:update']), validator({
    request: {
        body: {
            user: {
                dob: validator.optional(validator.isDate()),
                phone: validator.optional(validator.isNumeric())
            }
        }
    }
}), ctx => {
    if (ctx.params.username !== 'me') {
        let error = "Couldn't update other user's info";
        ctx.response.status = 401;
        ctx.body = error;
        throw new Error(error);
    }
    let postData = ctx.request.body.user,
        user = ctx.state.user;
    if (postData.gender) {
        user.gender = postData.gender.toLowerCase();
    }
    if (postData.firstName) {
        user.firstName = postData.firstName;
    }
    if (postData.lastName) {
        user.lastName = postData.lastName;
    }
    if (postData.dob) {
        user.dob = new Date(postData.dob);
    }
    if (postData.phone) {
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
}).put('add payment', '/me/payment_methods', auth.authenticate(['user:updatePayment']), ctx => {
    let token = ctx.query.stripeToken;
    // TODO: Read stripe docs
    ctx.body = { user: {} };
});