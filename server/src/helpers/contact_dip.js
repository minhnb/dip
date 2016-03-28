'use strict';

const db = require('../db');

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
                let name = 'Dip',
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
                return group.save().then(group => {
                    let message = new db.messages({
                        user: dipId,
                        group: group,
                        content: content || 'Welcome to Dip. We hope you will enjoy it here'
                    });
                    return message.save().then(() => {
                        return group;
                    });
                });
            } else {
                return group;
            }
        });
}

module.exports = {
    sendMessage: sendMessage
};