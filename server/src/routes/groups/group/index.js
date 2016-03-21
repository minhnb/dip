'use strict';

const router = require('koa-router')();

const entities = require('../../../entities');
const inputValidator = require('../../../validators');

const utils = require('../../../helpers/utils');

const memberRouter = require('./members');
const messageRouter = require('./messages');

module.exports = router;

router.get('/',
        ctx => {
            let group = ctx.state.group;
            return group.populate('owner')
                .populate('members.ref')
                .execPopulate()
                .then(() => {
                    return group.populateLastMessage().then(() => {
                        ctx.body = {group: entities.group(group)};
                    });
                });
        }
    )
    .put('/',
        utils.checkGroupOwner,
        inputValidator.groups.updateGroup(),
        ctx => {
            let group = ctx.state.group,
                name = ctx.request.body.name,
                description = ctx.request.body.description;

            if (name !== undefined) {
                group.name = name;
            }
            if (description !== undefined) {
                group.description = description;
            }
            return group.save().then(() => {
                ctx.status = 204;
            });
        }
    )
    .delete('/',
        ctx => {
            let user = ctx.state.user,
                group = ctx.state.group;
            if (user._id.equals(group.owner)) {
                // Delete group
                return group.remove().then(() => {
                    ctx.status = 204;
                });
            } else {
                group.currentMember.remove();
                return group.save().then(() => {
                    ctx.status = 204;
                });
            }
        }
    )
    .use('/members',
        memberRouter.routes(),
        memberRouter.allowedMethods()
    )
    .use('/messages',
        messageRouter.routes(),
        messageRouter.allowedMethods()
    )
    .put('/seen',
        inputValidator.groups.seenMessage(),
        ctx => {
            let group = ctx.state.group,
                currentMember = group.currentMember;

            currentMember.lastMessage = ctx.request.body.lastMessage;
            return group.save().then(() => {
                ctx.status = 200;
            });
        }
    );