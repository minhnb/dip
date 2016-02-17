'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var utils = require('../utils');
var config = require('../config');

var Schema = mongoose.Schema;
var cardSchema = require('./subSchemas/creditCard');

var userSchema = new Schema({
    //username: { type: String, required: true },
    email: { type: String, required: true, index: { unique: true } },
    encryptedPassword: { type: String, required: true },
    salt: { type: String, required: true },
    firstName: String,
    lastName: String,
    gender: { type: String, required: true, enum: ['male', 'female', 'na'] },
    dob: Date,
    phone: String,
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
        balance: { type: Number, required: true, default: 0 },
        cards: [cardSchema]
    },
    resetPasswordToken: Schema.ObjectId, // We can get createdAt field from the ObjectId
    devices: [{ type: Schema.ObjectId, ref: 'Device' }],
    sessions: [String],
    facebookId: { type: String, index: { unique: true, sparse: true } }
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
    var _this = this;

    return Promise.resolve().then(function () {
        if (!_this.salt) {
            return _this.generateSalt().then(function (salt) {
                _this.salt = salt;
                _this.encryptedPassword = _this.encryptPassword(password);
            });
        } else {
            _this.encryptedPassword = _this.encryptPassword(password);
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
    var _this2 = this;

    var session = utils.generateToken(64);
    this.sessions.push(session);
    return this.save().then(function () {
        return new Promise(function (resolve, reject) {
            jwt.sign({ scopes: ['all'], jti: session }, config.jwt.key, {
                subject: _this2._id,
                jwtid: session,
                issuer: config.jwt.issuer,
                algorithm: config.jwt.algorithm
            }, function (token) {
                resolve(token);
            });
        });
    });
};

/**
 * @class
 * @type {Model<T>}
 */
var userModel = mongoose.model('User', userSchema);

module.exports = userModel;