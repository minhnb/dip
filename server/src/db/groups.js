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
            ref: 'User'
        },
        lastMessage: {
            type: Schema.ObjectId,
            ref: 'Message'
        }
        
    }]
}, {
    timestamps: true
});
groupSchema.index({name: 'text', description: 'text'});

groupSchema.static.findGroups = function(user, query) {
    let groupQuery;
    if (query) {
        let userPromise = userModel.find({
            $text: {$search: query}
        }).select('_id').exec();

        groupQuery = userPromise.then(users => {
            return this.find({
                $and: [
                    {'members.ref': user},
                    {
                        $or: [
                            {$text: {$search: query}},
                            {'members.ref': {$in: users}}
                        ]
                    }
                ]
            });
        });
    } else {
        groupQuery = this.find({'members.ref': user});
    }
    return groupQuery.sort({updatedAt: -1}).exec();
};

groupSchema.static.populateLastMessage = function(groups) {
    return messageModel.aggregate([
        {$match: {group: {$in: groups.map(g => g._id)}}},
        {$sort: {group: 1, createdAt: 1}},
        {$group: {
            _id: "$group",
            lastMessage: {$last: "$_id"}
        }}
    ]).exec().then(msgs => {
        groups.forEach(group => {
            let lastMsg = msgs.id(group);
            group.lastMessage = lastMsg ? lastMsg.lastMessage : null;
        });
        return groups;
    });
};

groupSchema.methods.findMember = function(memberId) {
    return this.members.find(m => m.ref.equals(memberId));
};

const groupModel = mongoose.model('Group', groupSchema);

module.exports = groupModel;