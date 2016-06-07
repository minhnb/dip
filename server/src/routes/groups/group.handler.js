'use strict';
const mongoose = require('mongoose');
const db = require('../../db');
const entities = require('../../entities');
const contactDipHelper = require('../../helpers/contact_dip');


exports.createOrAuthenticateGroup = function(ctx, next) {
	let group = ctx.request.body.group || (ctx.req.body ? ctx.req.body.group : undefined);
    if(group) {
	    return db.groups.findById(group)
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
    }

    let user = ctx.state.user;
    try {
        var members = ctx.request.body.members || JSON.parse(ctx.req.body.members)
    } catch (err) {
        ctx.throw(400, 'invalid members')
    };
    if(!members) ctx.throw(400, 'Missing members');
    if (!Array.isArray(members)) {
        ctx.throw(400, 'Members must be an array');
    }

    members = new Set(members);
    members.add(ctx.state.user.id);
    members = Array.from(members);
    // members.sort();
    members = members.map(member => mongoose.Types.ObjectId(member));

    let conditions = {
        'members.ref': {$all: members},
        'members': {$size: members.length}
    };

    return db.groups.findOne(conditions)
    .exec()
    .then(group => {
        if(group) {
            ctx.state.group = group;
            return next();
        } else {
            let name = ctx.request.body.name || '',
                description = ctx.request.body.description || '',
                friends = ctx.state.user.friends;
            if (!Array.isArray(members)) {
                ctx.throw(400, 'Members must be an array');
            }
            return db.users.find({
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
                    ctx.state.group = group;
                    ctx.status = 200;
                    ctx.body = {id: group._id};
                    return next();
                });
            });
        }
    })
};

exports.authenticateGroup = (ctx, next) => {
    return db.groups.findById(ctx.params.groupId)
        .exec()
        .then(group => {
        	if(!group) ctx.throw(404, 'Group not found');
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
};

exports.contactDip = ctx => {
    let contactDipPromise;
    let user = ctx.state.user;
    contactDipPromise = contactDipHelper.sendMessage(user, ctx.dipId, 'Welcome to Dip. We hope you will enjoy it here');
    return contactDipPromise.then(group => {   
        ctx.status = 200;
        ctx.body = {groupId: group._id}
    })
};

exports.addGroup = ctx => {
    let name = ctx.request.body.name || '',
        description = ctx.request.body.description || '',
        members = ctx.request.body.members || [],
        friends = ctx.state.user.friends;
    if (!Array.isArray(members) || members.length == 0) {
        ctx.throw(400, 'Members must be an array');
    }
    members = new Set(members);
    members.add(ctx.state.user.id);
    return db.users.find({
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
};

exports.getGroups = ctx => {
    let user = ctx.state.user,
        from = ctx.query.from;
    return db.groups.findGroups(user, from)
        .then(groups => {
            groups.forEach(group => {
                group.currentMember = group.findMember(user);
            });
            return db.groups.populate(groups, [
                {path: 'owner'},
                {path: 'members.ref'},
                {path: 'lastMessage'}
            ]);
        }).then(groups => {
            groups.map(group => {
                let conversationName = '';
                group.members.map(member => {
                    if(!member.ref.equals(group.owner)) {
                        let fullName = member.ref.firstName || '' + ' ' + member.ref.lastName || '';
                        conversationName += fullName + ', ';
                    }  
                })
                group.name = group.name ? group.name : conversationName.substr(0, conversationName.length - 2);
            })
            ctx.body = {groups: groups.map(entities.group)};
        });
};

exports.getGroup = ctx => {
    let group = ctx.state.group;
    return group.populate('owner')
        .populate('members.ref')
        .populate('lastMessage')
        .execPopulate()
        .then(() => {
            let conversationName = '';
            group.members.map(member => {
                if(!member.ref.equals(group.owner)) {
                    let fullName = member.ref.firstName || '' + ' ' + member.ref.lastName || '';
                    conversationName += fullName + ', ';
                }
            })
            group.name = group.name ? group.name : conversationName.substr(0, conversationName.length - 2);
            ctx.body = {group: entities.group(group)};
        });
};

exports.leaveGroup = ctx => {
    let group = ctx.state.group;
    group.currentMember.remove();
    return group.save().then(() => {
        ctx.status = 204;
    });
};

exports.deleteMember = ctx => {
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
};

exports.addMember = ctx => {
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
};

exports.getMembers = ctx => {
    let group = ctx.state.group;
    return group.populate('members.ref').execPopulate().then(() => {
        ctx.body = {members: group.members.map(m => entities.userReference(m.ref))};
    });
};

exports.updateSeen = ctx => {
    let group = ctx.state.group,
        currentMember = group.currentMember;

    currentMember.lastMessage = ctx.request.body.lastMessage;
    return group.save().then(() => {
        ctx.status = 200;
    });
};
