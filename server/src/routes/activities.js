"use strict";
const router = require('koa-router')();

module.exports = router;

router.get('/', (ctx) => {
    // TODO: authenticate user
    // TODO: return list of user's activities
    ctx.body = {activities: []};
});
