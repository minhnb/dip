"use strict";

const router = require('koa-router')();
const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../helpers/input_validator');
const stripe = require('../../helpers/stripe');
const s3 = require('../../helpers/s3');

const multer = require('koa-multer');

const friendRouter = require('./friends');
const cardRouter = require('./payment_methods');

module.exports = router;

router
    //.post('add user', '/', (ctx, next) => {
    //    // Why do we have a user-adding route here?
    //    let user_info = ctx.params.user;
    //    ctx.body = {user: ctx.request.body};
    //})
    .get('search user', '/',
        auth.authenticate(),
        ctx => {
            let query = ctx.query.query,
                userOpts = {
                    privateMode: false
                };
            if (query) {
                userOpts['$text'] = {$search: query};
            }
            return db.users.find(userOpts)
                .then(users => {
                ctx.body = {users: users.map(entities.user)};
            });
        }
    )
    .use('/friends', friendRouter.routes(), friendRouter.allowedMethods())
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
    .put('update user', '/:username',
        auth.authenticate(['user:update']),
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
                        newPassword: validator.optional(validator.validatePassword)
                    }
                }
            },
            params: {
                username: validator.isIn('me')
            }
        }),
        ctx => {
            //if (ctx.params.username !== 'me') {
            //    ctx.throw(401, "Couldn't update other user's info");
            //    //let error = "Couldn't update other user's info";
            //    //ctx.response.status = 401;
            //    //ctx.body = error;
            //    //throw new Error(error);
            //}
            let postData = ctx.request.body.user,
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
            return user.save().then(() => {
                ctx.response.status = 204;
            }).catch(err => {
                ctx.response.status = 400;
                ctx.body = "Bad request";
                throw err;
            });
        }
    )
    .put('add avatar', '/me/avatar',
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
    )
    .use('/me/payment_methods', cardRouter.routes(), cardRouter.allowedMethods());
