'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config');

var utils = require('../helpers/utils');

var Schema = mongoose.Schema;
var cardSchema = require('./subSchemas/creditCard');
var sessions = require('./sessions');

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
    facebookId: { type: String, index: { unique: true, sparse: true } }
}, {
    timestamps: true
});

userSchema.virtual('username').get(function () {
    return this.email;
});

/**
 * @properties avatarS3Path
 */
userSchema.virtual('avatarS3Path').get(function () {
    return 'avatars/' + this._id;
});

userSchema.statics.findByEmail = function (email, callback) {
    return this.findOne({ email: email }, callback);
};

userSchema.methods.generateSalt = function () {
    return crypto.randomBytes(64).toString('hex');
};
userSchema.methods.setPassword = function (password) {
    if (!this.salt) {
        this.salt = this.generateSalt();
    }
    this.encryptedPassword = this.encryptPassword(password);
};
userSchema.methods.checkPassword = function (password) {
    return this.encryptedPassword === this.encryptPassword(password);
};
userSchema.methods.encryptPassword = function (password) {
    return crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
};
userSchema.methods.generateJWT = function () {
    var _this = this;

    var sessionKey = utils.generateToken(64);
    var session = new sessions({ _id: sessionKey, user: this });
    return session.save().then(function () {
        return new Promise(function (resolve, reject) {
            jwt.sign({ scopes: ['all'], jti: sessionKey }, config.jwt.key, {
                subject: _this._id,
                jwtid: sessionKey,
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