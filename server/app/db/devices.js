'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    deviceId: { type: String,
        required: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    deviceToken: { // the gcm registration token
        type: String,
        required: true
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
deviceSchema.index({
    deviceId: 1,
    user: 1
}, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);