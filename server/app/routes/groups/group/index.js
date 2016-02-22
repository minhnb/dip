'use strict';

var router = require('koa-router')();

var entities = require('../../../entities');
var inputValidator = require('../../../validators');

var utils = require('../../../helpers/utils');

var memberRouter = require('./members');
var messageRouter = require('./messages');

module.exports = router;

router.get('/', function (ctx) {
    ctx.body = { group: entities.group(ctx.state.group) };
}).post('/', utils.checkGroupOwner, inputValidator.groups.updateGroup(), function (ctx) {
    var group = ctx.state.group,
        name = ctx.request.body.name,
        description = ctx.request.body.description;

    if (name !== undefined) {
        group.name = name;
    }
    if (description !== undefined) {
        group.description = description;
    }
    return group.save().then(function () {
        ctx.status = 204;
    });
}).delete('/', function (ctx) {
    var user = ctx.state.user,
        group = ctx.state.group;
    if (user._id.equals(group.owner ? group.owner._id : null)) {
        // Delete group
        return group.remove().then(function () {
            ctx.status = 204;
        });
    } else {
        group.depopulate('members');
        group.members.pull(user);
        return group.save().then(function () {
            ctx.status = 204;
        });
    }
}).use('/members', memberRouter.routes(), memberRouter.allowedMethods()).use('/messages', messageRouter.routes(), messageRouter.allowedMethods());