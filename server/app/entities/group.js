'use strict';

var userRef = require('./userRef');

function convertGroup(group) {
    return {
        id: group._id,
        owner: userRef(group.owner),
        name: group.name,
        description: group.description,
        image: group.image.url,
        members: group.members.map(userRef),
        createdAt: group.createdAt
    };
}

convertGroup.reference = function (group) {
    return {
        id: group._id,
        name: group.name,
        image: group.image.url,
        createdAt: group.createdAt
    };
};

module.exports = convertGroup;