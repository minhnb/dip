'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router
    .get('event', '/', ctx => {
        ctx.body = {event: entities.event(ctx.state.event, ctx.state.user)};
    })


module.exports = router;