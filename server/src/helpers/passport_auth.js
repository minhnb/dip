'use strict';

/**
 * Modified from https://github.com/jaredhanson/oauth2orize/blob/master/examples/express2/auth.js
 * UPDATE: Removed parts related to oauth2 (for now)
 */

const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;

const users = require('../db').users;
const sessions = require('../db').sessions;

const config = require('../config');
const crypto = require('crypto');

const request = require('request-promise');

const contactDip = require('./contact_dip');

module.exports = {
    passport: passport,
    login: login,
    facebookLogin: facebookLogin,
    authenticate: authenticateJwt
};

passport.use(new LocalStrategy(
    {session: false},
    function(username, password, done) {
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
    }
));

passport.use(new JwtStrategy(
    {secretOrKey: config.jwt.key, algorithms: [config.jwt.algorithm], issuer: config.jwt.issuer},
    function(jwt_payload, done) {
        sessions.findOne({_id: jwt_payload.jti, user: jwt_payload.sub}, function(err, session) {
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
                ctx.throw(400, ctx.state.error || 'Bad Request');
            }
        });
    }
}

function facebookLogin() {
    return (ctx, next) => { 
        let code = ctx.request.body.code;
        let hash = crypto.createHmac('sha256', config.facebook.secretId).update(code).digest('hex');
        let request_user_info_url = "https://graph.facebook.com/me?access_token=" + code + "&appsecret_proof=" + hash;
        return request(request_user_info_url).then(fbUserInfo => {
            fbUserInfo = JSON.parse(fbUserInfo);
            if(!fbUserInfo.email && !ctx.request.body.email) ctx.throw(400, 'Missing Email');
            let email = ctx.request.body.email.toLowerCase();
            return users.findByEmail(fbUserInfo.email).exec().then(user => {
                if (!user) {
                    user = new users({
                        email: fbUserInfo.email || email,
                        firstName: fbUserInfo.first_name,
                        lastName: fbUserInfo.last_name,
                        gender: fbUserInfo.gender,
                        facebookId: fbUserInfo.id
                    });
                    contactDip.sendMessage(user, ctx.dipId, 'Welcome to Dip. We hope you will enjoy it here');
                    return user.save();
                } else if(user.facebookId) {
                    return user;
                } else {
                    user.facebookId = fbUserInfo.id;
                    return user.save();
                }
            });
        }).catch(err => {
            err.status = 401;
            throw err;
        }).then(user => {
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
                ctx.throw(401, ctx.state.error || 'Unauthorized');
            }
        });
    }
}