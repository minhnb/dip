"use strict";

const router = require('koa-router')();
const auth = require('../helpers/passport_auth');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.get('get cities', '/',
    auth.authenticate(),
    ctx => {
        return db.cities.find({}).exec().then(listCities => {
            ctx.body = listCities.map(entities.cities);
        });
    }
);

