'use strict';

const userRef = require('./userRef');

function convertGroup(group) {
    let currentMember = group.currentMember;
    return {
        id: group._id,
        owner: userRef(group.owner),
        name: group.name,
        description: group.description,
        image: group.image.url,
        members: group.members.map(m => userRef(m.ref)),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        seen: !group.lastMessage || (currentMember && group.lastMessage._id.equals(currentMember.lastMessage)),
        lastMessage: group.lastMessage ? group.lastMessage.content : null
    };
}

convertGroup.reference = function(group) {
    let currentMember = group.currentMember;
    return {
        id: group._id,
        name: group.name,
        image: group.image.url,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        seen: !group.lastMessage || (currentMember && group.lastMessage._id.equals(currentMember.lastMessage)),
        lastMessage: group.lastMessage.content
    };
};

module.exports = convertGroup;