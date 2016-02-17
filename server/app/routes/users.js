"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');

var db = require('../db');
var entities = require('../entities');
var validator = require('../helpers/input_validator');

module.exports = router;

router.put('add user', '/', function (ctx, next) {
    // Why do we have a user-adding route here?
    var user_info = ctx.params.user;
    ctx.body = { user: ctx.request.body };
}).get('get user', '/:username', auth.authenticate(['user:read']), function (ctx) {
    return new Promise(function (resolve, reject) {
        if (ctx.params.username === 'me') {
            resolve(ctx.state.user);
        } else {
            resolve(db.users.findByEmail(ctx.params.username).exec());
        }
    }).then(function (user) {
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
}), function (ctx) {
    if (ctx.params.username !== 'me') {
        var error = "Couldn't update other user's info";
        ctx.response.status = 401;
        ctx.body = error;
        throw new Error(error);
    }
    var postData = ctx.request.body.user,
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
    return user.save().then(function () {
        ctx.response.status = 204;
    }).catch(function (err) {
        ctx.response.status = 400;
        ctx.body = "Bad request";
        throw err;
    });
}).put('add payment', '/me/payment_methods', auth.authenticate(['user:updatePayment']), function (ctx) {
    var token = ctx.query.stripeToken;
    // TODO: Read stripe docs
    ctx.body = { user: {} };
});