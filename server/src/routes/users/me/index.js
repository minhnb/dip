'use strict';

const router = require('koa-router')();

const multer = require('koa-multer');

const db = require('../../../db');
const entities = require('../../../entities');

const auth = require('../../../helpers/passport_auth');
const validator = require('../../../helpers/input_validator');
const s3 = require('../../../helpers/s3');
const imageUtils = require('../../../helpers/image');

const cardRouter = require('./payment_methods');
const promotionRouter = require('./promotions');
const membershipRoute = require('./membership');

const dipErrorDictionary = require('../../../constants/dipErrorDictionary');
const DIPError = require('../../../helpers/DIPError');

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
                    dob: validator.optional(validator.isDate()),
                    // phone: validator.optional(validator.isNumeric()),
                    gender: validator.optional(validator.isIn(['male', 'female', 'na'])),
                    oldPassword: validator.optional(),
                    newPassword: validator.optional(validator.validatePassword),
                    'private': validator.optional(validator.isBoolean()),
                    picture: {
                        provider: validator.optional(validator.isIn(['facebook', 'dip']))
                    }
                }
            }
        }
    }),
    ctx => {
        // console.log(ctx.request.body.user);
        let postData = ctx.request.body.user,
            user = ctx.state.user;

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
        if (postData.picture && postData.picture.provider) {
            user.avatar.provider = postData.picture.provider;
        }
        if (postData.oldPassword !== undefined) {
            let oldPwd = postData.oldPassword;
            if (!user.checkPassword(oldPwd)) {
                // ctx.throw(400, 'Wrong password');
                throw new DIPError(dipErrorDictionary.WRONG_PASSWORD);
            }
            user.setPassword(postData.newPassword);
        }
        if (postData.private !== undefined) {
            let mode = postData.private;
            user.privateMode = (mode == 'true' || mode == '1');
        }

        return user.save().then(() => {
            ctx.response.status = 204;
        }).catch(err => {
            // ctx.response.status = 400;
            // ctx.body = "Bad request";
            // throw err;
            throw new DIPError(dipErrorDictionary.UNKNOWN_ERROR);
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
                // ctx.throw(400, 'No image specified');
                throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
            } else {
                // TODO: convert/compress/process image before uploading to s3
                return imageUtils.resize(img.buffer, 256, 'jpg')
                    .then(data => {
                        let contentType = 'image/jpg';
                        return s3.upload(user.avatarS3Path, data, contentType)
                            .catch(err => {
                                console.error(err);
                                // ctx.throw(500, 'S3 Error');
                                throw new DIPError(dipErrorDictionary.S3_ERROR);
                            }).then(data => {
                                user.avatar.url = data.Location;
                                user.avatar.contentType = contentType;
                                user.avatar.provider = 'dip';
                                return user.save().then(() => {
                                    ctx.status = 200;
                                    ctx.body = {
                                        location: data.Location,
                                        contentType: contentType
                                    };
                                });
                            });
                    });
            }
        }
    ).use('/payment_methods', cardRouter.routes(), cardRouter.allowedMethods())
    .use('/promotions', promotionRouter.routes(), promotionRouter.allowedMethods())
    .use('/membership', membershipRoute.routes(), membershipRoute.allowedMethods());
