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
        type: Schema.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);