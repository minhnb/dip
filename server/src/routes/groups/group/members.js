'use strict';

const router = require('koa-router')();

const entities = require('../../../entities');
const inputValidator = require('../../../validators');

const utils = require('../../../helpers/utils');

module.exports = router;

router.get('/',
        ctx => {
            let group = ctx.state.group;
            return group.populate('members.ref').execPopulate().then(() => {
                ctx.body = {members: group.members.map(m => entities.userReference(m.ref))};
            });
        }
    )
    .post('/',
        utils.checkGroupOwner,
        inputValidator.members.addMember(),
        ctx => {
            let userId = ctx.request.body.user,
                group = ctx.state.group,
                member = group.findMember(userId);
            if (!member) {
                group.members.push({ref: userId});
                return group.save().then(() => {
                    ctx.status = 204;
                });
            } else {
                ctx.status = 204;
            }
        }
    )
    .delete('/:memberId',
        utils.checkGroupOwner,
        inputValidator.members.removeMember(),
        ctx => {
            let userId = ctx.params.memberId,
                group = ctx.state.group;
            if (ctx.state.user.equals(userId)) {
                // If one (group's owner or not) wants to remove oneself from the group,
                // use DELETE /groups/group_id
                // The path /groups/group_id/members are for members' management only
                ctx.throw(400, "Couldn't remove yourself");
            } else {
                let member = group.findMember(userId);
                if (member) {
                    member.remove();
                    return group.save().then(() => {
                        ctx.status = 204;
                    });
                } else {
                    ctx.status = 204; // Appropriate status code?
                }
            }
        }
    );