"use strict";

const router = require('koa-router')();

module.exports = router;

router.post('/', ctx => {
    // TODO: authenticate user
    // TODO: register device
    console.log(ctx.request.body);
    ctx.status = 204;
});