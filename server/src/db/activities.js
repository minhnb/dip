'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const activitySchema = new Schema({
    actor: {type: Schema.ObjectId, ref: 'User', required: true},
    verb: {type: String, required: true}, // Reservation, ... ?
    object: {type: String, required: true}, // Reservation/...?
    feedId: String, // example: notification#username
    foreignId: {type: Schema.ObjectId, required: true}
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);