'use strict';

const router = require('koa-router')();

const multer = require('koa-multer');

const db = require('../../../db');
const entities = require('../../../entities');

const auth = require('../../../helpers/passport_auth');
const validator = require('../../../helpers/input_validator');
const s3 = require('../../../helpers/s3');

const cardRouter = require('./payment_methods');
const promotionRouter = require('./promotions');

module.exports = router;

router.get('get me', '/',
    ctx => {
        ctx.body = {user: entities.user(ctx.state.user, ctx.state.user)};
    }
)
.put('update me', '/',
    validator({
        request: {
            body: {
                user: {
                    email: validator.optional(validator.isEmail),
                    dob: validator.optional(validator.isDate()),
                    phone: validator.optional(validator.isNumeric()),
                    gender: validator.optional(validator.isIn('male', 'female', 'na')),
                    oldPassword: pwd => {
                        if (pwd !== undefined && !ctx.state.user.checkPassword(pwd)) {
                            throw new Error('Wrong password');
                        } else {
                            return true;
                        }
                    },
                    newPassword: validator.optional(validator.validatePassword),
                    'private': validator.optional(validator.isBoolean())
                }
            }
        }
    }),
    ctx => {
        let postData = ctx.request.body.user,
            user = ctx.state.user;

        //if (postData.email !== undefined) {
        //    user.email = postData.email.toLowerCase();
        //}

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
        if (postData.private !== undefined) {
            let mode = postData.private;
            user.privateMode = (mode == 'true' || mode == '1');
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
    .put('add avatar', '/avatar',
        auth.authenticate(),
        multer().single('image'),
        ctx => {
            let img = ctx.req.file, // NOTE: koa-multer still saves file to ctx.req
                user = ctx.state.user;
            if (!img) {
                ctx.throw(400, 'No image specified');
            } else {
                // TODO: convert/compress/process image before uploading to s3
                return s3.upload(user.avatarS3Path, img.buffer, img.mimeType)
                    .catch(err => {
                        console.error(err);
                        ctx.throw(500, 'S3 Error');
                    }).then(data => {
                        user.avatar.url = data.Location;
                        user.avatar.contentType = img.mimeType;
                        return user.save().then(() => {
                            ctx.status = 200;
                            ctx.body = {
                                location: data.Location,
                                contentType: img.mimeType
                            };
                        });
                    });
            }
        }
    ).use('/payment_methods', cardRouter.routes(), cardRouter.allowedMethods())
    .use('/promotions', promotionRouter.routes(), promotionRouter.allowedMethods());
