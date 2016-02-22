'use strict';

var router = require('koa-router')();

var entities = require('../../../entities');
var inputValidator = require('../../../validators');

var utils = require('../../../helpers/utils');

module.exports = router;

router.get('/', function (ctx) {
    var group = ctx.state.group;
    ctx.body = { members: group.members.map(entities.userReference) };
}).post('/', utils.checkGroupOwner, inputValidator.members.addMember(), function (ctx) {
    var userId = ctx.request.body.user,
        group = ctx.state.group;
    group.depopulate('members');
    group.members.addToSet(userId);
    return group.save().then(function () {
        ctx.status = 204;
    });
}).delete('/:id', utils.checkGroupOwner, inputValidator.members.removeMember(), function (ctx) {
    var userId = ctx.params.id,
        group = ctx.state.group;
    if (ctx.state.user.equals(userId)) {
        // If one (group's owner or not) wants to remove oneself from the group,
        // use DELETE /groups/group_id
        // The path /groups/group_id/members are for members' management only
        ctx.throw(400, "Couldn't remove yourself");
    } else {
        group.depopulate('members');
        group.members.pull(userId);
        return group.save().then(function () {
            ctx.status = 204;
        });
    }
});