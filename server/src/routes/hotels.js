"use strict";

const router = require('koa-router')();
const auth = require('../auth');

const utils = require('../helpers/utils');
const resourcesServices = require('../services/resources');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = router;

router
    .use('/', auth.authenticate(), utils.isAdmin)
    .get('get pending hotels', '/pending',
        async(ctx => {
            ctx.body = await(resourcesServices.getListPendingHotel());
        })
    );