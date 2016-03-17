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
                    console.log(groups);
                    ctx.body = {groups: groups.map(entities.group)}
                });
        }
    )
    .post('/',
        validator.groups.addGroup(),
        ctx => {
            let name = ctx.request.body.name || '',
                description = ctx.request.body.description || '',
                members = ctx.request.body.members || [];
            let group = new db.groups({
                name: name,
                description: description,
                owner: ctx.state.user,
                members: Array.from(new Set(members.map(m => {
                    return {member: m.member.toLowerCase()};  
                })))
            });
            //group.members.addToSet({member: ctx.state.user._id});

            return group.save().then(group => {
                console.log(group);
                ctx.status = 200;
                ctx.body = {group: entities.group(group)}
            });
        }
    )
    .put('/seen',
        validator.groups.updateGroup(),
        ctx => {
            let group = ctx.request.body.group,
            members = ctx.request.body.members || [];
            return db.groups.findOne({group: group})
                .exec()
                .then(group => {
                    if(group) {
                        group.members = Array.from(new Set(members.map(m => {
                            return {
                                member: m.member.toLowerCase(),
                                lastMessage: m.lastMessage.toLowerCase()
                            };  
                        })))
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
                        && !group.members.some(m => m._id.equals(ctx.state.user._id))) {
                        ctx.throw(403); // Access denied
                    } else {
                        return next();
                    }
                });
        },
        groupRouter.routes(),
        groupRouter.allowedMethods()
    );