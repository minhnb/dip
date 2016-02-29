'use strict';

const userRef = require('./userRef');
const group = require('./group');

function convertMessage(message) {
    return {
        id: message._id,
        user: userRef(message.user),
        groupId: message.group._id ? message.group._id : message.group,
        content: message.content,
        image: message.media,
        createdAt: message.createdAt
    };
}

module.exports = convertMessage;