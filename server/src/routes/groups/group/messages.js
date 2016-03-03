'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const inputValidator = require('../../../validators');

const gcm = require('../../../helpers/gcm');

const multer = require('koa-multer');

const s3 = require('../../../helpers/s3');

module.exports = router;

router.get('/',
        inputValidator.limitParams(),
        ctx => {
            let group = ctx.state.group,
                limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20,
                offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;

            return db.messages.find({group: group})
                .sort({createdAt: -1})
                .limit(limit)
                .skip(offset)
                .populate('user')
                .exec()
                .then(messages => {
                    ctx.body = {messages: messages.map(entities.message)};
                });
        }
    )
    .post('/',
        inputValidator.messages.addMessage(),
        multer().single('image'), 
        ctx => {
            let user = ctx.state.user,
                group = ctx.state.group,
                content = ctx.request.body.content || ctx.req.body.content;
            let img = ctx.req.file;
            let message = new db.messages({
                user: user,
                group: group,
                content: content || ''
            });

            let p;
            if(img) {
                p = s3.upload(message.messageImageS3Path, img.buffer, img.mimeType)
                .catch(err => {
                    console.error(err);
                    ctx.throw(500, 'S3 Error');
                }).then(data => {
                    message.media = {
                        url: data.Location,
                        contentType: img.mimeType
                    };
                });
            } else {
                p = Promise.resolve();
            }
            return p.then(() => {
                return message.save().then(message => {
                    // TODO: Send push notification to all members
                    ctx.status = 200;
                    ctx.body = {message: entities.message(message)};

                    let entityMessage = entities.message(message);
                    let payload = {
                        data: entityMessage,
                        notification: {
                            title: entityMessage.user.fullName,
                            body: entityMessage.content,
                            sound: 'default',
                            badge: 1,
                            click_action: 'chat'
                        }
                    };
                    group.members.forEach(member => {
                        // A user can have multiple phones,
                        // and so we need to send push notification to all of them just in case
                        //if (member._id.equals(user._id)) return;
                        gcm.pushNotification(member, payload)
                            .then(data => {
                                console.log('gcm response', data);
                            })
                            .catch(err => {
                                console.error('gcm error', err);
                            });
                    });
                });
            });
        }
    );