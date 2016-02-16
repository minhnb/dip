'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const utils = require('../utils');
const config = require('../config');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    //username: { type: String, required: true },
    email: { type: String, required: true, index: { unique: true } },
    encryptedPassword: { type: String, required: true },
    salt: { type: String, required: true },
    firstName: String,
    lastName: String,
    gender: { type: String, required: true, enum: ['male', 'female', 'na'] },
    status: String,
    location: String,
    timezone: String,
    locale: String,
    avatar: {
        url: { type: String },
        contentType: { type: String }
    },
    account: {
        stripeId: String,
        balance: { type: Number, required: true, default: 0 }
    },
    resetPasswordToken: Schema.ObjectId, // We can get createdAt field from the ObjectId
    devices: [{ type: Schema.ObjectId, ref: 'Device' }],
    sessions: [String],
    facebookId: { type: String, index: { unique: true } }
}, {
    timestamps: true
});

userSchema.virtual('username').get(function () {
    return this.email;
});

userSchema.statics.findByEmail = function (email, callback) {
    return this.findOne({ email: email }, callback);
};
userSchema.methods.generateSalt = function () {
    return new Promise(function (resolve, reject) {
        crypto.randomBytes(64, function (err, buf) {
            if (err) reject(err);else resolve(buf.toString('hex'));
        });
    });
};
userSchema.methods.setPassword = function (password) {
    return Promise.resolve().then(() => {
        if (!this.salt) {
            return this.generateSalt().then(salt => {
                this.salt = salt;
                this.encryptedPassword = this.encryptPassword(password);
            });
        } else {
            this.encryptedPassword = this.encryptPassword(password);
        }
    });
};
userSchema.methods.checkPassword = function (password) {
    return this.encryptedPassword === this.encryptPassword(password);
};
userSchema.methods.encryptPassword = function (password) {
    return crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
};
userSchema.methods.generateJWT = function () {
    var session = utils.generateToken(64);
    this.sessions.push(session);
    return this.save().then(() => {
        return new Promise((resolve, reject) => {
            jwt.sign({ scopes: ['all'], jti: session }, config.jwt.key, {
                subject: this._id,
                jwtid: session,
                issuer: config.jwt.issuer,
                algorithm: config.jwt.algorithm
            }, token => {
                resolve(token);
            });
        });
    });
};

/**
 * @class
 * @type {Model<T>}
 */
const userModel = mongoose.model('User', userSchema);

module.exports = userModel;