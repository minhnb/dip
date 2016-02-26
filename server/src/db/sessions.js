'use strict';

const mongoose = require('mongoose');

const deviceSchema = require('./subSchemas/device');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    _id: String,
    user: {type: Schema.ObjectId, ref: 'User', required: true},
    createdAt: {type: Date, expires: 2592000, default: Date.now, required: true},
    device: {
        type: deviceSchema,
        required: false
    }
});

/**
 * @class
 * @type {Model<T>}
 */
const sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;