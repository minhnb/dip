'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    _id: String,
    user: {type: Schema.ObjectId, ref: 'User', required: true},
    createdAt: {type: Date, expires: 2592000, default: Date.now, required: true},
    device: {
        deviceId: {
            type: String
        },
        deviceToken: { // the gcm registration token
            type: String
        },
        status: Number, // what status?
        receiveNotification: {
            type: Boolean
        },
        //apnsEnvironment: String,
        details: {
            model: String,
            osName: String,
            osVersion: String,
            carrier: String,
            appVersion: String
        }
    }
});

/**
 * @class
 * @type {Model<T>}
 */
const sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;