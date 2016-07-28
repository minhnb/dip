"use strict";

const router = require('koa-router')();
const auth = require('../helpers/passport_auth');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.get('get locations', '/',
    auth.authenticate(),
    ctx => {
        return db.dipLocations.find({}).sort({order: 1}).exec().then(listLocations => {
            ctx.body = listLocations.map(entities.dipLocations);
        });
    }
);

