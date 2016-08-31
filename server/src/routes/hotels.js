"use strict";

const router = require('koa-router')();
const auth = require('../auth');

const utils = require('../helpers/utils');
const resourcesServices = require('../services/resources');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = router;

router
    .use('/', auth.authenticate(), auth.isPartnerOrAdmin)
    .get('get pending hotels', '/pending',
        utils.isAdmin,
        async(ctx => {
            ctx.body = await(resourcesServices.getListPendingHotel());
        })
    )
    .get('get hotel list', '/', async (ctx => {
        ctx.body = await(resourcesServices.getHotelList(ctx.state.user));
    }));