"use strict";

const router = require('koa-router')();
const auth = require('../helpers/passport_auth');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.get('get promotion', '/:code',
    auth.authenticate(),
    ctx => {
        return db.coupons.findOne({code: ctx.params.code}).exec().then(data => {
            ctx.body = {promotion: entities.promotion(data)};
        });
    }
);