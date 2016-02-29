'use strict';

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
//tokenSchema.index({user: 1, token: 1}, {unique: true});
tokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(20).toString('hex');
};

var tokenModel = mongoose.model('PasswordToken', tokenSchema);

module.exports = tokenModel;