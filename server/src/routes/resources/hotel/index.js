'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

const offersRouter = require('./offers');

router
    .get('hotel', '/', ctx => {
        ctx.body = {hotel: entities.hotel(ctx.state.hotel)};
    })
    .use('/offers',
        offersRouter.routes(),
        offersRouter.allowedMethods()
    )


module.exports = router;