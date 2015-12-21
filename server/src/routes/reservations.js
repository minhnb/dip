"use strict";
const router = require('koa-router')();

module.exports = router;

router
    .put('add reservation', '/', ctx => {
        // TODO: authenticate user
        // TODO: return list of announcements
        ctx.body = {reservation: ctx.request.body};
    })
    .get('get reservations', '/:username', ctx => {
        ctx.body = {reservations: [], username: ctx.params.username};
    });