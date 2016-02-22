'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    deviceId: { type: String,
        required: true,
        index: { unique: true }
    },
    deviceToken: { // the gcm registration token
        type: String,
        required: true,
        index: { unique: true }
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    status: Number, // what status?
    //apnsEnvironment: String,
    details: {
        model: String,
        osName: String,
        osVersion: String,
        carrier: String,
        appVersion: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema);