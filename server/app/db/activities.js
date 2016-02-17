'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var activitySchema = new Schema({
    actor: { type: Schema.ObjectId, ref: 'User', required: true },
    verb: { type: String, required: true },
    object: { type: String, required: true },
    feedId: String, // example: notification#username
    foreignId: { type: Schema.ObjectId, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);