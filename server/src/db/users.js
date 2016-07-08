'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const utils = require('../helpers/utils');

const Schema = mongoose.Schema;
const cardSchema = require('./subSchemas/creditCard');
const membershipSchema = require('./subSchemas/membership');
const sessions = require('./sessions');

const userSchema = new Schema({
    //username: { type: String, required: true },
    email: {
        type: String,
        required: true,
        index: {unique: true}
    },
    encryptedPassword: {
        type: String,
        required: false
    },
    salt: {
        type: String,
        required: false
    },
    firstName: String,
    lastName: String,
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'na']
    },
    dob: String,
    phone: String,
    status: String,
    location: String,
    timezone: String,
    locale: String,
    avatar: {
        url: {type: String},
        provider: {
            type: String,
            enum: ['facebook', 'dip']
        },
        mediaType: {type: String}
    },
    account: {
        stripeId: String,
        promotions: [{
            type: Schema.ObjectId,
            ref: 'Promotion'
        }],
        balance: {
            type: Number,
            required: true,
            default: 0
        },
        subscriptions: [membershipSchema],
        defaultSubscription: Schema.ObjectId,
        cards: [cardSchema],
        defaultCardId: Schema.ObjectId,
        refCode: {
            type: String,
            require: true
        }
    },
    resetPasswordToken: Schema.ObjectId, // We can get createdAt field from the ObjectId
    devices: [{
        type: Schema.ObjectId,
        ref: 'Device'
    }],
    facebookId: {
        type: String,
        index: {
            unique: true,
            sparse: true
        }
    },
    privateMode: {
        type: Boolean,
        required: true,
        default: false
    },
    friends: [{
        type: Schema.ObjectId,
        ref: 'User'
    }],
    role: {
        type: String,
        enum: ['admin', 'user'],
        require: true,
        default: 'user'
    }
}, {
    timestamps: true
});
userSchema.index({firstName: 'text', lastName: 'text'});

userSchema.pre('save', function(next) {
    if (this.dob) {
        this.dob = utils.convertDate(this.dob);
    }
    if (this.isNew) {
        this.account.refCode = utils.generateMemberCode(this.email, 5);
    }
    next();
});

userSchema.virtual('username').get(function() {
    return this.email;
});
userSchema.virtual('nameOrEmail').get(function() {
    let arr = [];
    if (this.firstName) {
        arr.push(this.firstName);
    }
    if (this.lastName) {
        arr.push(this.lastName);
    }
    let name = arr.join(' ');
    if (!name) {
        name = this.email;
    }
    return name;
});

/**
 * @properties avatarS3Path
 */
userSchema.virtual('avatarS3Path').get(function() {
    return 'avatars/' + this._id;
});

userSchema.statics.findByEmail = function(email, callback) {
    if (email) {
        email = email.toLowerCase();
    }
    return this.findOne({email: email}, callback);
};


userSchema.methods.generateSalt = function() {
    return crypto.randomBytes(64).toString('hex');
};
userSchema.methods.setPassword = function(password) {
    if (!this.salt) {
        this.salt = this.generateSalt();
    }
    this.encryptedPassword = this.encryptPassword(password);
};
userSchema.methods.checkPassword = function(password) {
    return this.encryptedPassword === this.encryptPassword(password);
};
userSchema.methods.encryptPassword = function (password) {
    return crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
};
userSchema.methods.generateJWT = function() {
    var sessionKey = utils.generateToken(64);
    var session = new sessions({_id: sessionKey, user: this});
    return session.save().then(() => {
        return new Promise((resolve, reject) => {
            jwt.sign({scopes: ['all'], jti: sessionKey}, config.jwt.key, {
                subject: this._id,
                jwtid: sessionKey,
                issuer: config.jwt.issuer,
                algorithm: config.jwt.algorithm
            }, token => {
                resolve(token);
            });
        });
    });
};
userSchema.methods.setRefCode = function(code) {
    this.account.refCode = code;
}

/**
 * @class
 * @type {Model<T>}
 */
const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
