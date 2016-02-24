"use strict";

var router = require('koa-router')();
var db = require('../db');
var entities = require('../entities');

var auth = require('../helpers/passport_auth');
var validator = require('../helpers/input_validator');
var stripe = require('../helpers/stripe');
var s3 = require('../helpers/s3');

var multer = require('koa-multer');

module.exports = router;

router
//.post('add user', '/', (ctx, next) => {
//    // Why do we have a user-adding route here?
//    let user_info = ctx.params.user;
//    ctx.body = {user: ctx.request.body};
//})
.get('get user', '/:username', auth.authenticate(['user:read']), function (ctx) {
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
}).put('update user', '/:username', auth.authenticate(['user:update']), validator({
    request: {
        body: {
            user: {
                email: validator.optional(validator.isEmail),
                dob: validator.optional(validator.isDate()),
                phone: validator.optional(validator.isNumeric()),
                gender: validator.optional(validator.isIn('male', 'female', 'na')),
                oldPassword: function oldPassword(pwd) {
                    if (pwd !== undefined && !ctx.state.user.checkPassword(pwd)) {
                        throw new Error('Wrong password');
                    } else {
                        return true;
                    }
                },
                newPassword: validator.optional(validator.validatePassword)
            }
        }
    },
    params: {
        username: validator.isIn('me')
    }
}), function (ctx) {
    //if (ctx.params.username !== 'me') {
    //    ctx.throw(401, "Couldn't update other user's info");
    //    //let error = "Couldn't update other user's info";
    //    //ctx.response.status = 401;
    //    //ctx.body = error;
    //    //throw new Error(error);
    //}
    var postData = ctx.request.body.user,
        user = ctx.state.user;

    if (postData.email !== undefined) {
        user.email = postData.email.toLowerCase();
    }

    if (postData.gender !== undefined) {
        user.gender = postData.gender;
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
        user.avatar.mediaType = postData.picture.mediaType;
    }
    if (postData.oldPassword !== undefined) {
        user.setPassword(postData.newPassword);
    }
    return user.save().then(function () {
        ctx.response.status = 204;
    }).catch(function (err) {
        ctx.response.status = 400;
        ctx.body = "Bad request";
        throw err;
    });
}).post('add payment', '/me/payment_methods', auth.authenticate(['user:updatePayment']), validator({
    request: {
        body: {
            stripeToken: validator.required(true)
        }
    }
}), function (ctx) {
    var token = ctx.request.body.stripeToken,
        user = ctx.state.user;
    return stripe.customers.createSource(ctx.state.user.account.stripeId, {
        source: token
    }).catch(function (err) {
        err.status = 500; // Which is the appropriate http code for stripe error?
        throw err;
    }).then(function (card) {
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
        user.save().then(function () {
            ctx.response.status = 200;
            ctx.body = { newCard: entities.creditCard(userCard) };
        });
    });
}).put('add avatar', '/me/avatar', auth.authenticate(), multer().single('image'), function (ctx) {
    var img = ctx.req.file,
        // NOTE: koa-multer still saves file to ctx.req
    user = ctx.state.user;
    if (!img) {
        ctx.throw(400, 'No image specified');
    } else {
        // TODO: convert/compress/process image before uploading to s3
        return s3.upload(user.avatarS3Path, img.buffer, img.mimeType).catch(function (err) {
            console.error(err);
            ctx.throw(500, 'S3 Error');
        }).then(function (data) {
            user.avatar.url = data.Location;
            user.avatar.contentType = img.mimeType;
            return user.save().then(function () {
                ctx.status = 200;
                ctx.body = {
                    location: data.Location,
                    contentType: img.mimeType
                };
            });
        });
    }
});