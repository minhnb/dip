'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const msgSchema = new Schema({
    group: {
        type: Schema.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
msgSchema.index({content: 'text'});

module.exports = mongoose.model('Message', msgSchema);