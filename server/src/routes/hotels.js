"use strict";

const router = require('koa-router')();
const auth = require('../auth');

const utils = require('../helpers/utils');
const resourcesServices = require('../services/resources');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const submissionStatus = require('../constants/submissionStatus');

module.exports = router;

router
    .use('/', auth.authenticate(), auth.isPartnerOrAdmin)
    .get('get hotel list', '/',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user));
        })
    )
    .get('get hotel list', '/all',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user));
        })
    )
    .get('get on-air hotels', '/live',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user, {active: true}));
        })
    )
    .get('get initial hotels', '/initial',
        auth.isPartner,
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user,
                {'submission.status': submissionStatus.INITIAL}));
        })
    )
    .get('get approved hotels', '/submission/approved',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user,
                {'submission.status': submissionStatus.APPROVED}));
        })
    )
    .get('get pending hotels', '/submission/pending',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user,
                {'submission.status': submissionStatus.PENDING}));
        })
    )
    .get('get declined hotels', '/submission/declined',
        async(ctx => {
            ctx.body = await(resourcesServices.getHotelList(ctx.state.user,
                {'submission.status': submissionStatus.DECLINED}));
        })
    );