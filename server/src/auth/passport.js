'use strict';

/**
 * Modified from https://github.com/jaredhanson/oauth2orize/blob/master/examples/express2/auth.js
 * UPDATE: Removed parts related to oauth2 (for now)
 */

const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;

const crypto = require('crypto');
const request = require('request-promise');
const querystring = require('querystring');

const config = require('../config');
const users = require('../db/index').users;
const sessions = require('../db/index').sessions;

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

module.exports = passport;

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

passport.authenticateFacebook = function(ctx) {
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
    });
};