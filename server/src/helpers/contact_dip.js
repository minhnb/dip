'use strict';

const config = require('../config');
const db = require('../db');

function _getDipGroup(user, dipId) {
    let userId = user._id.toString();
    return db.groups
        .findOne({
            'members.ref': {'$all': [dipId, userId]},
            members: {
                $size: 2
            }
        })
        .exec()
        .then(group => {
            if(!group) {
                let name = config.strings.dipGroupName,
                    description = '',
                    members = [dipId, userId];
                group = new db.groups({
                    name: name,
                    description: description,
                    owner: dipId,
                    members: members.map(m => {
                        return {ref: m};
                    })
                });
                group.wasNew = true;
                return group.save();
            } else {
                return group;
            }
        });
}

function init(user, dipId) {
    return _getDipGroup(user, dipId).then(group => {
        if (group.wasNew) {
            let message = new db.messages({
                user: dipId,
                group: group,
                content: config.strings.dipWelcomeMessage
            });
            return message.save().then(message => {
                group.lastMessage = message;
                return group.save();
            });
        } else {
            return group;
        }
    });
}

function sendMessage(user, dipId, content) {
    let userId = user._id.toString();
    return db.groups
        .findOne({
            'members.ref': {'$all': [dipId, userId]},
            members: {
                $size: 2
            }
        })
        .exec()
        .then(group => {
            if(!group) {
                let name = 'Support',
                    description = '',
                    members = [dipId, userId];
                let message = new db.messages({
                    user: dipId,
                    content: content || config.strings.dipWelcomeMessage
                });
                group = new db.groups({
                    name: name,
                    description: description,
                    owner: dipId,
                    members: members.map(m => {
                        return {ref: m};
                    })
                });
                return group.save().then(group => {
                    message.group = group;
                    return message.save().then(() => {
                        group.lastMessage = message;
                        return group.save().then(group => {
                            return group;
                        });
                    });
                });
            } else {
                return group;
            }
        });
}

module.exports = {
    initialize: init,
    sendMessage: sendMessage
};