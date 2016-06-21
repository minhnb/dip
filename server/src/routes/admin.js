"use strict";

const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const utils = require('../helpers/utils');
const adminServices = require('../services/admin');

module.exports = router;

router.post('update app context', '/appcontext/update',
    auth.authenticate(),
    utils.isAdmin,
    ctx => {
        ctx.status = 200;
        adminServices.updateAppContext(ctx.app.context);
    }
);