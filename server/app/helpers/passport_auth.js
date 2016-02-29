'use strict';

/**
 * Modified from https://github.com/jaredhanson/oauth2orize/blob/master/examples/express2/auth.js
 * UPDATE: Removed parts related to oauth2 (for now)
 */

var passport = require('koa-passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;

var users = require('../db/users');
var sessions = require('../db/sessions');

var config = require('../config/index');

module.exports = {
    passport: passport,
    login: login,
    authenticate: authenticateJwt
};

passport.use(new LocalStrategy({ session: false }, function (username, password, done) {
    users.findByEmail(username).exec().then(function (user) {
        if (!user) {
            done(null, false, 'Invalid user');
        } else if (user.encryptedPassword !== user.encryptPassword(password)) {
            done(null, false, 'Invalid password');
        } else {
            done(null, user);
        }
    }).catch(function (err) {
        done(err);
    });
}));

passport.use(new JwtStrategy({ secretOrKey: config.jwt.key, algorithms: [config.jwt.algorithm], issuer: config.jwt.issuer }, function (jwt_payload, done) {
    sessions.find({ _id: jwt_payload.jti, user: jwt_payload.sub }, function (err, session) {
        if (err) {
            done(err);
        } else if (!session) {
            done(null, false, 'Session has been expired');
        } else {
            users.findById(jwt_payload.sub, function (err, user) {
                if (err) {
                    done(err);
                } else if (!user) {
                    done(null, false, 'Invalid user');
                } else {
                    done(null, { user: user, session: session, scopes: jwt_payload.scopes });
                }
            });
        }
    });
}));

function login() {
    return function (ctx, next) {
        return passport.authenticate('local', { session: false }, function (user, info, status) {
            if (!user) {
                ctx.state.error = info;
            } else {
                ctx.state.user = user;
            }
        })(ctx, next).then(function () {
            if (ctx.state.user) {
                return next();
            } else {
                ctx.response.status = 401;
                //ctx.body = 'Unauthorized';
                ctx.body = ctx.state.error || 'Unauthorized';
                throw ctx.state.error;
            }
        });
    };
}

function authenticateJwt(requiredScopes) {
    return function (ctx, next) {
        return passport.authenticate('jwt', { session: false }, function (data, info, status) {
            if (data) {
                var jwtScopes = data.scopes;
                console.log("Provided: " + JSON.stringify(jwtScopes));
                console.log("Required: " + JSON.stringify(requiredScopes));
                // TODO: Compare jwt and required scope
                ctx.state.user = data.user;
                ctx.state.session = data.session;
                ctx.state.scopes = data.scopes;
            } else {
                ctx.state.error = info;
            }
        })(ctx, next).then(function () {
            console.log('User authorized');
            if (ctx.state.user) {
                return next();
            } else {
                ctx.status = 401;
                ctx.body = 'Unauthorized';
                throw ctx.state.error;
            }
        });
    };
}