'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const offersRouter = require('./offers');


router
    .get('special offer', '/', ctx => {
        ctx.body = {offers: ctx.state.specialOffer};
    })
    .use('/passes',
        offersRouter.routes(),
        offersRouter.allowedMethods()
    )
module.exports = router;