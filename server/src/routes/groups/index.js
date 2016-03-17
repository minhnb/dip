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
                query = ctx.query.query,
                limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10,
                offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;

            let groupQuery;
            if (query) {
                let userPromise = db.users.find({
                    $text: {$search: query}
                }).select('_id').exec();

                groupQuery = userPromise.then(users => {
                    return db.groups.find({
                        $and: [
                            {members: user},
                            {
                                $or: [
                                    {$text: {$search: query}},
                                    {members: {$elemMatch:{member: {$in: users}}}}
                                ]
                            }
                        ]
                    });
                });
            } else {
                groupQuery = db.groups.find({members: {$elemMatch:{member: user}}});
            }
            return groupQuery.sort({updatedAt: -1})
                .limit(limit)
                .skip(offset)
                .populate('owner')
                .populate('members')
                .exec()
                .then(groups => {
                    let lastMessage = null;
                    groups.forEach(group => {
                        group.members.forEach(i => {
                            if(user._id.equals(i.member)) {
                                lastMessage = i.lastMessage;
                                return;
                            }
                        })
                        if(lastMessage) {
                            return db.messages
                                .findOne({group: group._id})
                                .sort({createdAt: -1})
                                .exec()
                                .then(message => {
                                    group.unRead = message._id.equals(lastMessage) ? false : true;
                                })
                        } else {
                            group.unRead = false;
                        }
                        
                    })  
                    ctx.body = {groups: groups.map(entities.group)}
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
            return db.users.find({
                $and: [
                    {_id: {$in: members.map(m => m.member)}},
                    {$or: [
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
                        return {member: m};
                    })
                });
                group.members.addToSet({member: ctx.state.user});
                return group.save().then(group => {
                    ctx.status = 200;
                    ctx.body = {group: entities.group(group)}
                });
            });
        }
    )
    .put('/seen',
        validator.groups.updateGroup(),
        ctx => {
            let group = ctx.request.body.group,
                user = ctx.state.user,
                lastMessage = ctx.request.body.lastMessage;
            return db.groups.findOne({group: group})
                .exec()
                .then(group => {
                    if(group) {
                        group.members.forEach(i => {
                            if(ctx.state.user.equals(i.member)) {
                                i.lastMessage = lastMessage;
                            }
                        })
                        return group.save();
                    } else {
                        ctx.throw(404); // Group not found
                    }
                })
        }
    )
    
    .use('/:groupId',
        (ctx, next) => {
            return db.groups.findById(ctx.params.groupId)
                .populate('owner')
                .populate('members')
                .exec()
                .then(group => {
                    ctx.state.group = group;
                    if (!ctx.state.user._id.equals(group.owner._id)
                        && !group.members.some(m => {
                            m.member._id.equals(ctx.state.user._id)})) {
                        ctx.throw(403); // Access denied
                    } else {
                        return next();
                    }
                });
        },
        groupRouter.routes(),
        groupRouter.allowedMethods()
    );