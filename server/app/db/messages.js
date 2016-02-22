'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var msgSchema = new Schema({
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

module.exports = mongoose.model('Message', msgSchema);