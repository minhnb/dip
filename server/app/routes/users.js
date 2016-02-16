"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.put('add user', '/', (ctx, next) => {
    let user_info = ctx.params.user;
    ctx.body = { user: ctx.request.body };
}).get('get user', '/:username', auth.authenticate(['user:read']), ctx => {
    return db.users.findByEmail(ctx.params.username).exec().then(user => {
        if (!user) {
            ctx.body = { user: null, error: 'Invalid user' };
        } else {
            ctx.body = { user: entities.userReference(user) };
        }
    });
}).post('update user', '/:username', auth.authenticate(['user:update']), ctx => {
    let user_info = ctx.params.user;
    if (ctx.params.username !== 'me') {
        // TODO: handle unauthorized error
        throw new Error();
    }
    // TODO: Update user's information
    ctx.body = { user: { username: ctx.params.username } };
}).put('add payment', '/me/payment_methods', auth.authenticate(['user:updatePayment']), ctx => {
    let token = ctx.params.stripe_token;
    ctx.body = { user: {} };
});