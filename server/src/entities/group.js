'use strict';

const userRef = require('./userRef');

function convertGroup(group) {
    return {
        id: group._id,
        owner: userRef(group.owner),
        name: group.name,
        description: group.description,
        image: group.image.url,
        members: group.members.map(m => {
            return {member: userRef(m.member)}
        }),
        createdAt: group.createdAt,
        seen: group.seen
    };
}

convertGroup.reference = function(group) {
    return {
        id: group._id,
        name: group.name,
        image: group.image.url,
        createdAt: group.createdAt
    };
};

module.exports = convertGroup;