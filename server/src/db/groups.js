'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userModel = require('./users');
const messageModel = require('./messages');

const groupSchema = new Schema({
    owner: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: String,
    description: String,
    image: {
        url: String
    },
    members: [{
        ref: {
            type: Schema.ObjectId,
            ref: 'User',
            index: true
        },
        lastMessage: {
            type: Schema.ObjectId,
            ref: 'Message'
        }
        
    }],
    lastMessage: Schema.ObjectId
}, {
    timestamps: true
});
groupSchema.index({name: 'text', description: 'text'});

groupSchema.statics.findGroups = function(user, from) {
    let conditions = {};
    conditions['members.ref'] = user;
    if(from) conditions['updatedAt'] = {$gt: new Date(from).toISOString()};
    return this.find(conditions)
    .sort({updatedAt: -1})
    .exec();
};

groupSchema.statics.findGroupMembers = function(members) {
    return this.findOne({
        'members.ref': {$all: members.map(Schema.ObjectId)},
        'members': {$size: members.length}
    }).exec();
};

groupSchema.statics.populateLastMessage = populateLastMessage;

groupSchema.methods.populateLastMessage = function() {
    return populateLastMessage([this]).then(groups => groups[0]);
};

groupSchema.methods.findMember = function(memberId) {
    memberId = memberId._id || memberId;
    return this.members.find(m => m.ref.equals(memberId));
};

const groupModel = mongoose.model('Group', groupSchema);

module.exports = groupModel;

function populateLastMessage(groups) {
    return messageModel.aggregate([
        {$match: {group: {$in: groups.map(g => g._id)}}},
        {$sort: {group: 1, createdAt: 1}},
        {$group: {
            _id: "$group",
            lastMessage: {$last: "$_id"}
        }}
    ]).exec().then(msgs => {
        let msgMapping = msgs.reduce((obj, msg) => {
            obj[msg._id.toString()] = msg.lastMessage;
            return obj;
        }, {});
        groups.forEach(group => {
            let lastMsg = msgMapping[group.id];
            group.lastMessage = lastMsg ? lastMsg.lastMessage : null;
        });
        return groups;
    });
}