"use strict";
const router = require('koa-router')();

module.exports = router;

router
    .put('add user', '/', (ctx, next) => {
        let user_info = ctx.params.user;
        ctx.body = {user: ctx.request.body};
    })
    .get('get user', '/:username', (ctx, next) => {
        // TODO: authenticate user
        // TODO: Return user's information
        ctx.body = {user: {username: ctx.params.username}};
    })
    .post('update user', '/:username', (ctx, next) => {
        // TODO: authenticate user
        let user_info = ctx.params.user;
        if (ctx.params.username !== 'me') {
            // TODO: handle unauthorized error
            throw new Error();
        }
        // TODO: Update user's information
        ctx.body = {user: {username: ctx.params.username}};
    })
    .put('add payment', '/me/payment_methods', (ctx, next) => {
        // TODO: authenticate user
        // TODO: handle error
        let token = ctx.params.stripe_token;
        ctx.body = {user: {}};
    });
