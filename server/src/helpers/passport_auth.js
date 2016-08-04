'use strict';

/**
 * Modified from https://github.com/jaredhanson/oauth2orize/blob/master/examples/express2/auth.js
 * UPDATE: Removed parts related to oauth2 (for now)
 */

const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;

const querystring = require('querystring');

const users = require('../db').users;
const sessions = require('../db').sessions;

const config = require('../config');
const crypto = require('crypto');

const request = require('request-promise');

const contactDip = require('./contact_dip');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const makerEvent = require('./iftttMakerEvent');

module.exports = {
    passport: passport,
    login: login,
    facebookLogin: facebookLogin,
    authenticate: authenticateJwt,
    refreshAccessToken: refreshAccessToken,
    setupToken: returnToken
};

passport.use(new LocalStrategy(
    {session: false},
    function(username, password, done) {
        users.findByEmail(username).exec().then(user => {
            if (!user) {
                done(null, false, 'Invalid user');
            } else if (!user.checkPassword(password)) {
                // If user doesn't have a password, or if password checking fails,
                // return error
                done(null, false, 'Invalid password');
            } else {
                done(null, user);
            }
        }).catch(err => {
            done(err);
        });
    }
));

passport.use(new JwtStrategy(
    {secretOrKey: config.jwt.key, algorithms: [config.jwt.algorithm], issuer: config.jwt.issuer},
    function(jwt_payload, done) {
        sessions.findOne({_id: jwt_payload.jti, user: jwt_payload.sub}, function(err, session) {
            if (err) {
                done(err);
            } else if (!session) {
                done(null, false, 'Invalid session');
            } else {
                users.findById(jwt_payload.sub, function (err, user) {
                    if (err) {
                        done(err);
                    } else if (!user) {
                        done(null, false, 'Invalid user');
                    } else {
                        done(null, {user: user, session: session, scopes: jwt_payload.scopes});
                    }
                });
            }
        });
    }
));

function login() {
    return (ctx, next) => {
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
}

function facebookLogin() {
    return (ctx, next) => { 
        let code = ctx.request.body.code;
        let hash = crypto.createHmac('sha256', config.facebook.secretId).update(code).digest('hex');
        let params = {
            access_token: code,
            appsecret_proof: hash
        };
        let request_user_info_url = "https://graph.facebook.com/me?" + querystring.stringify(params);
        return request(request_user_info_url).then(fbUserInfo => {
            fbUserInfo = JSON.parse(fbUserInfo);
            return users.createFromFacebook(fbUserInfo, ctx.request.body);
        }, err => {
            // err.status = 401;
            // throw err;
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        }).then(user => {
            makerEvent.dipUserSignup({
                value1: user.nameOrEmail,
                value2: user.email,
                value3: 1
            });
            contactDip.initialize(user, ctx.dipId);

            ctx.state.user = user;
            return next();
        });

    }
}

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

function refreshAccessToken() {
    return (ctx, next) => {
        let refreshToken = ctx.request.body.refreshToken;
        if (!refreshToken || typeof refreshToken != 'string' || refreshToken.length == 0) {
            throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
        }
        return sessions.getByRefreshToken(refreshToken).exec().then(session => {
            if (!session) {
                throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
            } else {
                return session.generateToken().then(token => {
                    returnToken(token, ctx);
                    return next();
                });
            }
        });
    }
}

function returnToken(token, ctx) {
    ctx.response.status = 200;
    ctx.body = {
        JWT: token.accessToken,
        refreshToken: token.refreshToken
    }
}