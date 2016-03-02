'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');

const config = require('../config');

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
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
tokenSchema.statics.generateToken = function() {
    //return crypto.randomBytes(20).toString('hex');
    return randomstring.generate({length: 8, charset: 'numeric'});
};

const tokenModel = mongoose.model('PasswordToken', tokenSchema);

module.exports = tokenModel;