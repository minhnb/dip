"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.get('get coupon', '/:code', auth.authenticate(), ctx => {
    return db.coupons.findById(ctx.params.code).exec().then(data => {
        ctx.body = { coupon: entities.coupon(data) };
    });
});