'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var entities = require('../../../entities');
var inputValidator = require('../../../validators');

var gcm = require('../../../helpers/gcm');

module.exports = router;

router.get('/', inputValidator.limitParams(), function (ctx) {
    var group = ctx.state.group,
        limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20,
        offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;

    return db.messages.find({ group: group }).sort({ createdAt: -1 }).limit(limit).skip(offset).populate('user').exec().then(function (messages) {
        ctx.body = { messages: messages.map(entities.message) };
    });
}).put('/', inputValidator.messages.addMessage(), function (ctx) {
    var user = ctx.state.user,
        group = ctx.state.group,
        content = ctx.request.body.content;
    var message = new db.messages({
        user: user,
        group: group,
        content: content
    });
    return message.save().then(function () {
        // TODO: Send push notification to all members
        ctx.status = 204;
        group.members.forEach(function (member) {
            gcm.pushNotification(member, entities.message(message));
        });
    });
});