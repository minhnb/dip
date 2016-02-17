'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    _id: String,
    user: {type: Schema.ObjectId, ref: 'User', require: true},
    createdAt: {type: Date, expires: 2592000, default: Date.now, require: true}
});

/**
 * @class
 * @type {Model<T>}
 */
const sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;