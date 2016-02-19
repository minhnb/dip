'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');

const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

// Sub routes
const photosRouter = require('./photos');
const offersRouter = require('./offers');
const amenitiesRouter = require('./amenities');
const ratingRouter = require('./rating');

router.get('pool', '/', ctx => {
        ctx.body = {pool: entities.pool(ctx.state.pool)};
    })
    .use('/photos',
        photosRouter.routes(),
        photosRouter.allowedMethods()
    )
    .use('/offers',
        offersRouter.routes(),
        offersRouter.allowedMethods()
    )
    .use('/amenities',
        amenitiesRouter.routes(),
        amenitiesRouter.allowedMethods()
    )
    .use('/rating',
        ratingRouter.routes(),
        ratingRouter.allowedMethods()
    );

module.exports = router;