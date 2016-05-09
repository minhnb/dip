'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router
    .get('special offer', '/', ctx => {
        ctx.body = {offers: ctx.state.specialOffer};
    })
module.exports = router;