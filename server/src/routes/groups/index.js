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
                query = ctx.query.query;

            return db.groups.findGroups(user, query)
                .then(db.groups.populateLastMessage)
                .then(groups => {
                    groups.forEach(group => {
                        group.currentMember = group.findMember(user);
                    });
                    return db.groups.populate(groups, [
                        {path: 'owner'},
                        {path: 'members.ref'}
                    ]);
                }).then(groups => {
                    ctx.body = {groups: groups.map(entities.group)};
                });
        }
    )
    .post('/',
        validator.groups.addGroup(),
        ctx => {
            let name = ctx.request.body.name || '',
                description = ctx.request.body.description || '',
                members = ctx.request.body.members || [],
                friends = ctx.state.user.friends;
            if (!Array.isArray(members)) {
                ctx.throw(400, 'Members must be an array');
            }
            members = new Set(members);
            members.add(ctx.state.user.id);
            return db.users.fi =nd({
                $and: [
                    {_id: {$in: Array.from(members)}},
                    {$or: [
                        {_id: ctx.state.user},
                        {_id: {$in: friends}},
                        {privateMode: false}
                    ]}
                ]
            }).then(dbMembers => {
                if (dbMembers.length < members.length) {
                    ctx.throw(400, 'Invalid member id');
                }
                let group = new db.groups({
                    name: name,
                    description: description,
                    owner: ctx.state.user,
                    members: dbMembers.map(m => {
                        return {ref: m};
                    })
                });
                return group.save().then(group => {
                    ctx.status = 200;
                    ctx.body = {group: entities.group(group)}
                });
            });
        }
    )
    .use('/:groupId',
        (ctx, next) => {

            return db.groups.findById(ctx.params.groupId)
                .exec()
                .then(group => {
                    let user = ctx.state.user,
                        currentMember = group.findMember(user);
                    if (!user._id.equals(group.owner) && !currentMember) {
                        ctx.throw(403); // Access denied
                    } else {
                        ctx.state.group = group;
                        group.currentMember = currentMember;
                        return next();
                    }
                });
        },
        groupRouter.routes(),
        groupRouter.allowedMethods()
    );