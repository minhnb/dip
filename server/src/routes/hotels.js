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
    .get('get hotel list', '/',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user));
        })
    )
    .get('get approved hotels', '/approved',
        async(ctx => {
            ctx.body = await(resourcesServices.getListApprovedHotel(ctx.state.user));
        })
    )
    .get('get pending hotels', '/pending',
        async(ctx => {
            ctx.body = await(resourcesServices.getListPendingHotel(ctx.state.user));
        })
    );