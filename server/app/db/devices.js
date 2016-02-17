'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    deviceId: String,
    pushToken: String,
    status: Number,
    deviceToken: String,
    subscriptionToken: String,
    apnsEnvironment: String,
    details: {
        model: String,
        osName: String,
        osVersion: String,
        carrier: String,
        appVersion: String
    }
});

deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);