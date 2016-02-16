'use strict';

/**
 * Modified from https://github.com/jaredhanson/oauth2orize/blob/master/examples/express2/auth.js
 * UPDATE: Removed parts related to oauth2 (for now)
 */

const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;

const users = require('./db/users');

const config = require('./config');

module.exports = {
    passport: passport,
    login: login,
    authenticate: authenticateJwt
};

passport.use(new LocalStrategy({ session: false }, function (username, password, done) {
    users.findByEmail(username).exec().then(user => {
        if (!user) {
            done(null, false, 'Invalid user');
        } else if (user.encryptedPassword !== user.encryptPassword(password)) {
            done(null, false, 'Invalid password');
        } else {
            done(null, user);
        }
    }).catch(err => {
        done(err);
    });
}));

passport.use(new JwtStrategy({ secretOrKey: config.jwt.key, algorithms: [config.jwt.algorithm], issuer: config.jwt.issuer }, function (jwt_payload, done) {
    users.findById(jwt_payload.sub, function (err, user) {
        if (err) done(err);else {
            if (!user) {
                done(null, false, 'Invalid user');
            } else if (user.sessions.indexOf(jwt_payload.jti) == -1) {
                console.log('jti', jwt_payload.jti);
                console.log(jwt_payload);
                done(null, false, 'Token has been revoked');
            } else done(null, { user: user, scopes: jwt_payload.scopes });
        }
    });
}));

function login() {
    return (ctx, next) => {
        return passport.authenticate('local', { session: false }, (user, info, status) => {
            if (!user) {
                ctx.state.error = info;
            } else {
                ctx.state.user = user;
            }
        })(ctx, next).then(() => {
            if (ctx.state.user) {
                return next();
            } else {
                ctx.response.status = 401;
                ctx.body = 'Unauthorized';
                throw ctx.state.error;
            }
        });
    };
}

function authenticateJwt(requiredScopes) {
    return (ctx, next) => {
        return passport.authenticate('jwt', { session: false }, (data, info, status) => {
            if (data) {
                let jwtScopes = data.scopes;
                console.log("Provided: " + JSON.stringify(jwtScopes));
                console.log("Required: " + JSON.stringify(requiredScopes));
                // TODO: Compare jwt and required scope
                ctx.state.user = data.user;
                ctx.state.scopes = data.scopes;
            } else {
                ctx.state.error = info;
            }
        })(ctx, next).then(() => {
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