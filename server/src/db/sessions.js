'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const config = require('../config');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    _id: String, // jwt token id
    user: {type: Schema.ObjectId, ref: 'User', required: true},
    refreshToken: {type: String, required: true, index: {unique: true}},
    createdAt: {type: Date, default: Date.now, required: true},
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

sessionSchema.statics.getByRefreshToken = function(refreshToken) {
    return this.findOne({refreshToken: refreshToken});
};

sessionSchema.methods.generateToken = function() {
    var sessionId = this._id.toString(),
        userId = this.user._id ? this.user._id.toString() : this.user.toString(),
        self = this;
    return new Promise((resolve, reject) => {
        jwt.sign({scopes: ['all'], jti: sessionId}, config.jwt.key, {
            subject: userId,
            jwtid: sessionId,
            issuer: config.jwt.issuer,
            algorithm: config.jwt.algorithm,
            expiresIn: config.jwt.expiresIn
        }, token => {
            resolve({
                accessToken: token,
                refreshToken: self.refreshToken
            });
        });
    });
};

/**
 * @class
 * @type {Model<T>}
 */
const sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;