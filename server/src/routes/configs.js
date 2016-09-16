"use strict";

const router = require('koa-router')();
const auth = require('../auth');

const db = require('../db');
const entities = require('../entities');

var country = require('countryjs');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = router;

router.get('get config', '/',
    auth.authenticate(),
    async(ctx => {
        var listLocations = await(db.dipLocations.find({}).sort({order: 1}).exec());
        var dipLocations = listLocations.map(entities.dipLocations);
        ctx.body = {
            dipLocations: dipLocations,
            country: {
                states: country.states('US')
            }
        };
    })
);

