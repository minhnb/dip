'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var sessionSchema = new Schema({
  _id: String,
  user: { type: Schema.ObjectId, ref: 'User', require: true },
  createdAt: { type: Date, expires: 2592000, default: Date.now, require: true }
});

/**
 * @class
 * @type {Model<T>}
 */
var sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;