'use strict';

var router = require('koa-router')();

var db = require('../../db');
var validator = require('../../validators');
var entities = require('../../entities');
var auth = require('../../helpers/passport_auth');

var groupRouter = require('./group');

module.exports = router;

router.use('/', auth.authenticate()).get('/', validator.limitParams(), function (ctx) {
    var user = ctx.state.user,
        limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10,
        offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;
    return db.groups.find({ members: user }).limit(limit).skip(offset).populate('owner').populate('members').exec().then(function (groups) {
        ctx.body = { groups: groups.map(entities.group) };
    });
}).put('/', validator.groups.addGroup(), function (ctx) {
    var name = ctx.request.body.name || '',
        description = ctx.request.body.description || '',
        members = ctx.request.body.members || [];
    var group = new db.groups({
        name: name,
        description: description,
        owner: ctx.state.user,
        members: new Set(members.map(function (m) {
            return m.toLowerCase();
        }))
    });
    group.members.addToSet(ctx.state.user._id);
    return group.save().then(function () {
        ctx.status = 204;
    });
}).use('/:id', function (ctx, next) {
    return db.groups.findById(ctx.params.id).populate('owner').populate('members').exec().then(function (group) {
        ctx.state.group = group;
        if (!ctx.state.user._id.equals(group.owner._id) && !group.members.id(ctx.state.user._id)) {
            ctx.throw(403); // Access denied
        } else {
                return next();
            }
    });
}, groupRouter.routes(), groupRouter.allowedMethods());