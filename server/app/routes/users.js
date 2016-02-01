"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');

module.exports = router;

router.put('add user', '/', (ctx, next) => {
    let user_info = ctx.params.user;
    ctx.body = { user: ctx.request.body };
}).get('get user', '/:username', auth.authenticate(['user:read']), ctx => {
    console.log('render body');
    ctx.body = { user: { username: ctx.params.username } };
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