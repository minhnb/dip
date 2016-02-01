"use strict";
const router = require('koa-router')();
const auth = require('../passport_auth');

module.exports = router;

router.get('get sale', '/:id',
    auth.authenticate(),
    ctx => {
    // TODO: return sale's information
    ctx.body = {sale: {id: ctx.params.id}};
});