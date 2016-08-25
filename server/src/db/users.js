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

const DIPError = require('../helpers/DIPError');
const dipErrorDictionary = require('../constants/dipErrorDictionary');

const userSchema = new Schema({
    //username: { type: String, required: true },
    email: {
        type: String,
        required: true,
        lowercase: true,
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
            required: true
        },
        pendingBalance: {
            type: Number,
            required: true,
            default: 0
        },
        pendingPromotions: [{
            type: Schema.ObjectId,
            ref: 'Promotion'
        }]
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
        enum: ['admin', 'user', 'partner'],
        required: true,
        default: 'user'
    }
}, {
    timestamps: true
});
userSchema.index({firstName: 'text', lastName: 'text'});

userSchema.pre('validate', function(next) {
    if (this.isNew || !this.account.refCode) {
        this.account.refCode = utils.generateMemberCode(this.email, 5);
    }
    next();
});
userSchema.pre('save', function(next) {
    if (this.dob) {
        this.dob = utils.convertDate(this.dob);
    }
    if (this.isNew) {
        this.wasNew = true;
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

userSchema.statics.findByFacebookId = function(id, cb) {
    return this.findOne({facebookId: id}, cb);
};

userSchema.statics.createFromFacebook = function(fbInfo, requestBody) {
    let facebookId = fbInfo.id,
        email = requestBody.email || fbInfo.email,
        firstName = requestBody.firstName !== undefined ? requestBody.firstName : fbInfo.first_name,
        lastName = requestBody.lastName !== undefined ? requestBody.lastName : fbInfo.last_name,
        gender = fbInfo.gender,
        dob = requestBody.dob;

    // Move email lowercase checking to user schema
    let newUser = new this({
        email: email,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        facebookId: facebookId,
        avatar: {
            provider: 'facebook'
        }
    });
    if (dob) {
        newUser.dob = dob;
    }

    return this.findByFacebookId(facebookId).exec().then(user => {
        if (!user) {
            if(!email) {
                // ctx.throw(400, 'Missing Email');
                throw new DIPError(dipErrorDictionary.MISSING_EMAIL);
            }
            // 'this' works because array function doesn't override the this scope
            return this.findByEmail(email).then(existUser => {
                if (existUser) {
                    throw new DIPError(dipErrorDictionary.EMAIL_EXISTED);
                } else {
                    return newUser.save();
                }
            });
        } else {
            return user;
        }
    });
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
userSchema.methods.hasPassword = function() {
    return this.encryptedPassword !== undefined && this.encryptedPassword !== null;
};
userSchema.methods.checkPassword = function(password) {
    return this.hasPassword() && this.encryptedPassword === this.encryptPassword(password);
};
userSchema.methods.encryptPassword = function (password) {
    return crypto.pbkdf2Sync(password, this.salt, 100000, 512, 'sha512').toString('hex');
};
userSchema.methods.generateJWT = function() {
    var sessionKey = utils.generateToken(64);
    var refreshToken = utils.generateToken(64);
    var session = new sessions({
        _id: sessionKey,
        user: this,
        refreshToken: refreshToken
    });
    return session.save().then(session => {
        return session.generateToken();
    });
};
userSchema.methods.setRefCode = function(code) {
    this.account.refCode = code;
};

userSchema.methods.isAdmin = function() {
    return this.role == 'admin';
};
userSchema.methods.isPartner = function() {
    return this.role == 'partner';
};

/**
 * @class
 * @type {Model<T>}
 */
const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
