"use strict";

const router = require('koa-router')();
const url = require('url');

const config = require('../config');
const db = require('../db');
const validator = require('../validators');
const mailer = require('../mailer');

const auth = require('../helpers/passport_auth');
const contactDip = require('../helpers/contact_dip');
const stripe = require('../helpers/stripe');
const utils = require('../helpers/utils');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const makerEvent= require('../helpers/iftttMakerEvent');

module.exports = router;

router
    .post('Log in', '/login',
        auth.login(),
        ctx => {
            return ctx.state.user.generateJWT().then(token => {
                auth.setupToken(token, ctx);
            });
        }
    )

    .post('Facebook Log-in', '/fblogin',
        auth.facebookLogin(),
        ctx => {
            return ctx.state.user.generateJWT().then(token => {
                auth.setupToken(token, ctx);
            });
        }
    )
    .post('Sign up', '/signup',
        validator.auth.signup(),
        ctx => {
            let refCodePromises;
            if(ctx.request.body.code) {
                let code = ctx.request.body.code.toLowerCase();
                refCodePromises =  db.users.findOne({'account.refCode': code})
                .exec()
                .then(referer => {
                    if(!referer) {
                        // ctx.throw(400, 'Code not exist')
                        throw new DIPError(dipErrorDictionary.INVALID_INVITE_CODE);
                    }
                    return referer;
                })
            } else {
                refCodePromises = Promise.resolve();
            }
            return refCodePromises.then(referer => {
                var user = new db.users({
                    email: ctx.request.body.email.toLowerCase(),
                    firstName: ctx.request.body.firstName,
                    lastName: ctx.request.body.lastName,
                    gender: ctx.request.body.gender,
                    phone: ctx.request.body.phone ? ctx.request.body.phone : null
                });
                user.setPassword(ctx.request.body.password);
                // refCode is set directly when saving new user record -- see db.users
                // user.setRefCode(utils.generateMemberCode(user.email, 8));
                if(referer) user.account.balance += 2000;

                return user.save().then(user => {
                    contactDip.sendMessage(user, ctx.dipId, 'Welcome to Dip. We hope you will enjoy it here');
                    ctx.response.status = 204;
                    mailer.welcome([{
                        email: user.email,
                        name: user.nameOrEmail
                    }]);
                    stripe.addUser(user); // Not using return to allow it to process in background
                    makerEvent.dipUserSignup({
                        value1: user.nameOrEmail,
                        value2: user.email,
                        value3: 0
                    });
                    return user;
                }).then(user => {
                    if(referer) {
                        return db.refs.findOne({owner: referer._id})
                        .exec()
                        .then(ref => {
                            if(!ref) {
                                var ref = new db.refs({
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
                }).catch(err => {
                    if (err.code === 11000) {
                        // Duplicate key error -- existed email
                        // ctx.throw(409, "Email existed");
                        throw new DIPError(dipErrorDictionary.EMAIL_EXISTED);
                    } else {
                        // throw err;
                        console.log(err);
                        throw new DIPError(dipErrorDictionary.UNKNOWN_ERROR);
                    }
                });
            })
        }
    )
    .post('Sign out', '/logout',
        auth.authenticate(),
        ctx => {
            let session = ctx.state.session;

            return session.remove().then(session => {
                ctx.status = 200;
            });
        }
    )
    .post('/refreshtoken', auth.refreshAccessToken());
