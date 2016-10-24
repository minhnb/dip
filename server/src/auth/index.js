'use strict';

const async = require('asyncawait/async');
const await = require('asyncawait/await');
const compose = require('koa-compose');

const request = require('request-promise');

const config = require('../config');
const db = require('../db');
const sessions = require('../db').sessions;

const mailer = require('../mailer');

const stripe = require('../helpers/stripe');
const utils = require('../helpers/utils');
const contactDip = require('./../helpers/contact_dip');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');
const dipLoginBy = require('../constants/loginBy');
const userRole = require('../constants/userRole');

const makerEvent = require('./../helpers/iftttMakerEvent');

const passport = require('./passport');

function login(ctx, next) {
    ctx.state.sessionInfo = {
        loginBy: dipLoginBy.LOGIN_BY_PASSWORD,
        device: ctx.request.body.device
    };
    return passport.authenticate('local', {session: false}, (user, info, status) => {
        if (!user) {
            ctx.state.error = info;
        } else {
            ctx.state.user = user;
        }
    })(ctx, next).then(() => {
        if (ctx.state.user) {
            return next();
        } else {
            // ctx.throw(400, ctx.state.error || 'Bad Request');
            throw new DIPError(dipErrorDictionary.INVALID_USERNAME_OR_PASSWORD);
        }
    });
}

function facebookLogin(ctx, next) {
    ctx.state.sessionInfo = {
        loginBy: dipLoginBy.LOGIN_BY_FACEBOOK,
        device: ctx.request.body.device
    };
    return passport.authenticateFacebook(ctx).then(user => {
        if (user.wasNew) {
            _setupNewUser(ctx, user);
        }
        ctx.state.user = user;
        return next();
    });
}

var signupHandler = async (function (ctx, next) {
    var role = ctx.request.body.role || userRole.USER,
        referer;

    if ([userRole.USER, userRole.PARTNER].indexOf(role) == -1) {
        // TODO: Return more specific error
        throw new DIPError(dipErrorDictionary.BAD_REQUEST);
    }
    if (role == userRole.USER) {
        // Referer rule doesn't apply for partner
        referer = await (_getReferrer(ctx.request.body.code));
        if (ctx.request.body.code && !referer) {
            throw new DIPError(dipErrorDictionary.INVALID_INVITE_CODE);
        }
    }
    try {
        let user = await (_createUser(ctx, referer));
        _setupNewUser(ctx, user);
        ctx.response.status = 204;
        if(referer) {
            await (_addDipCreditToReferer(referer, user));
        }
        return next();
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error -- existed email
            // ctx.throw(409, "Email existed");
            throw new DIPError(dipErrorDictionary.EMAIL_EXISTED);
        } else {
            // throw err;
            // console.log(err);
            throw new DIPError(dipErrorDictionary.UNKNOWN_ERROR);
        }
    }
});

function authenticateJwt(requiredScopes) {
    return (ctx, next) => {
        return passport.authenticate('jwt', {session: false}, (data, info, status) => {
            if (data) {
                let jwtScopes = data.scopes;
                console.log("Provided: " + JSON.stringify(jwtScopes));
                console.log("Required: " + JSON.stringify(requiredScopes));
                // TODO: Compare jwt and required scope
                ctx.state.user = data.user;
                ctx.state.session = data.session;
                ctx.state.scopes = data.scopes;
            } else {
                ctx.state.error = info;
            }
        })(ctx, next).then(() => {
            console.log('User authorized');
            if (ctx.state.user) {
                return next();
            } else {
                // ctx.throw(401, ctx.state.error || 'Unauthorized');
                throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
            }
        });
    }
}

var isPartner = compose([
    authenticateJwt(),
    (ctx, next) => {
        if (ctx.state.user && ctx.state.user.role.indexOf(userRole.PARTNER) > -1) {
            return next();
        } else {
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        }
    }
]);
var isAdmin = compose([
    authenticateJwt(),
    (ctx, next) => {
        if (ctx.state.user && ctx.state.user.role.indexOf(userRole.ADMIN) > -1) {
            return next();
        } else {
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        }
    }
]);

var isPartnerOrAdmin = compose([
    authenticateJwt(),
    (ctx, next) => {
        if (ctx.state.user && (ctx.state.user.role.indexOf(userRole.PARTNER) > -1 || ctx.state.user.role.indexOf(userRole.ADMIN) > -1)) {
            return next();
        } else {
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        }
    }
]);

function setupAccessToken(ctx, next) {
    return ctx.state.user.generateJWT(ctx.state.sessionInfo).then(token => {
        _returnToken(token, ctx);
        return next();
    });
}

function refreshAccessToken(ctx, next) {
    let refreshToken = ctx.request.body.refreshToken;
    if (!refreshToken || typeof refreshToken != 'string' || refreshToken.length == 0) {
        throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
    }
    return sessions.getByRefreshToken(refreshToken).exec().then(session => {
        if (!session) {
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        } else {
            return session.generateToken().then(token => {
                _returnToken(token, ctx);
                return next();
            });
        }
    });
}

function deleteSession(ctx, next) {
    let session = ctx.state.session;

    return session.remove().then(session => {
        ctx.status = 200;
        return next();
    });
}

function _returnToken(token, ctx) {
    ctx.response.status = 200;
    ctx.body = {
        JWT: token.accessToken,
        refreshToken: token.refreshToken
    }
}

function _createUser(ctx, referer) {
    let requestRole = ctx.request.body.role || userRole.USER;
    let role = [requestRole];
    var user = new db.users({
        email: ctx.request.body.email.toLowerCase(),
        firstName: ctx.request.body.firstName,
        lastName: ctx.request.body.lastName,
        gender: ctx.request.body.gender,
        phone: ctx.request.body.phone ? ctx.request.body.phone : null,
        role: role
    });
    user.setPassword(ctx.request.body.password);
    // refCode is set directly when saving new user record -- see db.users
    // user.setRefCode(utils.generateMemberCode(user.email, 8));
    if(referer) user.account.balance += 2000;

    return user.save();
}

function _getReferrer(code) {
    if (!code) return Promise.resolve(null);
    code = code.toLowerCase();
    return db.users.findOne({'account.refCode': new RegExp('^' + code + '$','i')}).exec();
}

function _setupNewUser(ctx, user) {
    contactDip.initialize(user, ctx.dipId);
    mailer.welcome([{
        email: user.email,
        name: user.nameOrEmail
    }]);
    stripe.addUser(user); // Not using return to allow it to process in background
    makerEvent.dipUserSignup({
        value1: user.nameOrEmail,
        value2: user.email,
        value3: user.facebookId ? 1 : 0
    });
}

function _addDipCreditToReferer(referer, user) {
    return db.refs.findOne({owner: referer._id})
    .exec()
    .then(ref => {
        if(!ref) {
            ref = new db.refs({
                owner: referer,
                members: []
            })
        }
        ref.members.addToSet(user);
        return ref.save().then(() => {
            referer.account.balance += 2000;
            return referer.save().then(() => {
                // mailer.confirmDipShare(referer.email, {owner: referer.firstName, member: user.email});
                // mailer.confirmDipShare(user.email, {owner: user.firstName, member: user.email});
            });
        })
    })
}

module.exports = {
    passport: passport,
    login: login,
    facebookLogin: facebookLogin,
    signup: signupHandler,
    authenticate: authenticateJwt,
    isPartner: isPartner,
    isAdmin: isAdmin,
    isPartnerOrAdmin: isPartnerOrAdmin,
    refreshAccessToken: refreshAccessToken,
    setupAccessToken: setupAccessToken,
    deleteSession: deleteSession
};