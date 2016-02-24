'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var mongoose = require('mongoose');
var crypto = require('crypto');

var config = require('../config');

var Schema = mongoose.Schema;

var tokenSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    createdAt: {
        type: Date,
        expires: config.ttl.resetPassword.seconds,
        default: Date.now,
        required: true
    }
});
console.log('ttl config hour', config.ttl.resetPassword.hours, _typeof(config.ttl.resetPassword.hours));
console.log('ttl config second', config.ttl.resetPassword.seconds, _typeof(config.ttl.resetPassword.seconds));
//tokenSchema.index({user: 1, token: 1}, {unique: true});
tokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(20).toString('hex');
};

var tokenModel = mongoose.model('PasswordToken', tokenSchema);

module.exports = tokenModel;