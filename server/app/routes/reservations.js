"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var validator = require('../helpers/input_validator');

module.exports = router;

router.use('/', auth.authenticate()).put('add reservation', '/',
//validator({
//    request: {
//        body: {
//
//        }
//    }
//}),
function (ctx) {
    // TODO: add new reservation
    ctx.body = { reservation: ctx.request.body };
}).get('get reservations', '/:username', function (ctx) {
    ctx.body = { reservations: [], username: ctx.params.username };
});