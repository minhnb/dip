'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

const offersRouter = require('./offers');

router
    .get('hotel', '/', ctx => {
        return ctx.state.hotel.populate('services')
        .execPopulate().then(hotel => {
            ctx.body = {hotel: entities.hotel(hotel)};
        });
    })
    .use('/offers',
        offersRouter.routes(),
        offersRouter.allowedMethods()
    );


module.exports = router;