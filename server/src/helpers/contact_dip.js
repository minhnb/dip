'use strict';

const db = require('../db');
const initial = require('../initial');

function sendMessage(user, content) {
    let dipId = initial.dipChat();
    let userId = user._id.toString();
    return db.groups
        .find({members: {'$all': [dipId, userId]}})
        .exec()
        .then(group => {
            if(!group || group.length == 0) {
                let name = 'Dip',
                    description = '',
                    members = [dipId, userId];
                let group = new db.groups({
                    name: name,
                    description: description,
                    owner: dipId,
                    members: Array.from(new Set(members.map(m => m.toLowerCase())))
                });
                return group.save().then(group => {
                    let message = new db.messages({
                        user: user,
                        group: group,
                        content: content || ''
                    });
                    return message.save();
                });
            }
        })      
}

module.exports = {
    sendMessage: sendMessage
};