"use strict";
const router = require('koa-router')();

module.exports = router;

router.get('get sale', '/:id', ctx => {
    // TODO: authenticate user
    // TODO: return sale's information
    ctx.body = {sale: {id: ctx.params.id}};
});