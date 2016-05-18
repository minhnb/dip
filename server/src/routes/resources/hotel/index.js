'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router
    .get('hotel', '/', ctx => {
        ctx.body = {hotel: entities.hotel(ctx.state.hotel)};
    })


module.exports = router;