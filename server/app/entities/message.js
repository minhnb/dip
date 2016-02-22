'use strict';

var userRef = require('./userRef');
var group = require('./group');

function convertMessage(message) {
    return {
        id: message._id,
        user: userRef(message.user),
        groupId: message.group,
        content: message.content,
        createdAt: message.createdAt
    };
}

module.exports = convertMessage;