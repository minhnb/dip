'use strict';

const db = require('../../db');
const entities = require('../../entities');

const gcm = require('../../helpers/gcm');

const s3 = require('../../helpers/s3');
const crypto = require('crypto');

const dipErrorDictionary = require('../../constants/dipErrorDictionary');
const DIPError = require('../../helpers/DIPError');

exports.createMessage = function(ctx, next) {
    let user = ctx.state.user,
        group = ctx.state.group,
        content = ctx.request.body.content || ctx.req.body.content,
        message = new db.messages({
            user: user,
            group: group,
            content: content || ''
        });
    let p,
        img = ctx.req.file;
    if(img) {
        let hash = crypto.createHash('md5').update(img.buffer).digest("hex");
        p = s3.upload('messageImages/' + hash, img.buffer, img.mimeType)
        .catch(err => {
            console.error(err);
            // ctx.throw(500, 'S3 Error');
            throw new DIPError(dipErrorDictionary.S3_ERROR);
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
            group.updatedAt = new Date();
            group.lastMessage = message.id;
            group.save();
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
            group.members.forEach(i => {
                // A user can have multiple phones,
                // and so we need to send push notification to all of them just in case
                //if (member._id.equals(user._id)) return;
                gcm.pushNotification(i.ref, payload)
                    .then(data => {
                        console.log('gcm response', data);
                    })
                    .catch(err => {
                        console.error('gcm error', err);
                    });
            });
        });
    });
};

exports.getMessages = ctx => {
    let group = ctx.state.group,
        limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20,
        offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0,
        from = ctx.query.from,
        conditions = {};

    conditions['group'] = group;
    if(from) conditions['createdAt'] = {$gte: new Date(from).toISOString()};
    
    return db.messages.find(conditions)
        .sort({createdAt: -1})
        .limit(limit)
        .skip(offset)
        .populate('user')
        .exec()
        .then(messages => {
            ctx.body = {messages: messages.map(entities.message)};
        });
};