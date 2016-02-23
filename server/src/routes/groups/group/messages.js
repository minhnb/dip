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
    .put('/',
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
                group.members.forEach(member => {
                    gcm.pushNotification(member, entities.message(message))
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