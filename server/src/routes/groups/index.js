'use strict';

const router = require('koa-router')();

const db = require('../../db');
const validator = require('../../validators');
const entities = require('../../entities');
const auth = require('../../helpers/passport_auth');

const groupRouter = require('./group');

module.exports = router;

router.use('/', auth.authenticate())
    .get('/',
        validator.limitParams(),
        ctx => {
            let user = ctx.state.user,
                limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10,
                offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;
            return db.groups.find({members: user})
                .limit(limit)
                .skip(offset)
                .populate('owner')
                .populate('members')
                .exec()
                .then(groups => {
                    ctx.body = {groups: groups.map(entities.group)}
                });
        }
    )
    .put('/',
        validator.groups.addGroup(),
        ctx => {
            let name = ctx.request.body.name || '',
                description = ctx.request.body.description || '',
                members = ctx.request.body.members || [];
            let group = new db.groups({
                name: name,
                description: description,
                owner: ctx.state.user,
                members: new Set(members.map(m => m.toLowerCase()))
            });
            group.members.addToSet(ctx.state.user._id);
            return group.save().then(group => {
                ctx.status = 200;
                ctx.body = {group: entities.group(group)}
            });
        }
    )
    .use('/:id',
        (ctx, next) => {
            return db.groups.findById(ctx.params.id)
                .populate('owner')
                .populate('members')
                .exec()
                .then(group => {
                    ctx.state.group = group;
                    if (!ctx.state.user._id.equals(group.owner._id) && !group.members.id(ctx.state.user._id)) {
                        ctx.throw(403); // Access denied
                    } else {
                        return next();
                    }
                });
        },
        groupRouter.routes(),
        groupRouter.allowedMethods()
    );