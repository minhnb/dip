'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

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
        member: {
            type: Schema.ObjectId,
            ref: 'User'
        },
        lastMessage: {
            type: Schema.ObjectId,
            ref: 'Message',
        }
        
    }]
}, {
    timestamps: true
});
groupSchema.index({name: 'text', description: 'text'});

module.exports = mongoose.model('Group', groupSchema);