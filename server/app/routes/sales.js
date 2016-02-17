"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');

module.exports = router;

router.get('get sale', '/:id', auth.authenticate(), function (ctx) {
    // TODO: return sale's information
    ctx.body = { sale: { id: ctx.params.id } };
});