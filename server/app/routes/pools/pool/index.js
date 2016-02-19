'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var entities = require('../../../entities');

var validator = require('../../../validators');
var utils = require('../../../helpers/utils');

// Sub routes
var photosRouter = require('./photos');
var offersRouter = require('./offers');
var amenitiesRouter = require('./amenities');
var ratingRouter = require('./rating');

router.get('pool', '/', function (ctx) {
    ctx.body = { pool: entities.pool(ctx.state.pool) };
}).use('/photos', photosRouter.routes(), photosRouter.allowedMethods()).use('/offers', offersRouter.routes(), offersRouter.allowedMethods()).use('/amenities', amenitiesRouter.routes(), amenitiesRouter.allowedMethods()).use('/rating', ratingRouter.routes(), ratingRouter.allowedMethods());

module.exports = router;