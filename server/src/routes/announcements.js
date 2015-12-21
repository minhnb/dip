"use strict";
const router = require('koa-router')();

module.exports = router;

router.get('/', ctx => {
    // TODO: authenticate user
    // TODO: return list of announcements
    ctx.body = {announcements: []};
});