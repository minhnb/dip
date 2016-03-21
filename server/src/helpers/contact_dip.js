'use strict';

const db = require('../db');

function sendMessage(user, dipId, content) {
    let userId = user._id.toString();
    return db.groups
        .findOne({members: {'$all': [dipId, userId]}})
        .exec()
        .then(group => {
            if(!group) {
                let name = 'Dip',
                    description = '',
                    members = [dipId, userId];
                members.map(m => {
                    m => m.toLowerCase();
                })
                group = new db.groups({
                    name: name,
                    description: description,
                    owner: dipId,
                    members: members
                });
                return group.save().then(group => {
                    let message = new db.messages({
                        user: user,
                        group: group,
                        content: content || ''
                    });
                    return message.save().then(() => {
                        return group;
                    });
                });
            } else {
                return group;
            }
        })    
}

module.exports = {
    sendMessage: sendMessage
};