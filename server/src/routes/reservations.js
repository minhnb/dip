"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');
const validator = require('../input_validator');

module.exports = router;

router
    .use('/', auth.authenticate())
    .put('add reservation', '/',
        //validator({
        //    request: {
        //        body: {
        //
        //        }
        //    }
        //}),
        ctx => {
        // TODO: add new reservation
        ctx.body = {reservation: ctx.request.body};
    })
    .get('get reservations', '/:username', ctx => {
        ctx.body = {reservations: [], username: ctx.params.username};
    });