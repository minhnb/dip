"use strict";
const router = require('koa-router')();

module.exports = router;

router.get('/:code', ctx => {
    // TODO: authenticate user
    // TODO: return list of coupons
    ctx.body = {coupon: {code: ctx.params.code}};
});