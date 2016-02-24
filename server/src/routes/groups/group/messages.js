'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const inputValidator = require('../../../validators');

const gcm = require('../../../helpers/gcm');

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
        ctx => {
            let user = ctx.state.user,
                group = ctx.state.group,
                content = ctx.request.body.content;
            let message = new db.messages({
                user: user,
                group: group,
                content: content
            });
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
        }
    );