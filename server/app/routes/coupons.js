"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.get('get coupon', '/:code', auth.authenticate(), function (ctx) {
    return db.coupons.findById(ctx.params.code).exec().then(function (data) {
        ctx.body = { coupon: entities.coupon(data) };
    });
});