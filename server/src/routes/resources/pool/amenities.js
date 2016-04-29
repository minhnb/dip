'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router.get('/',
    ctx => {
        let pool = ctx.state.pool;
        return db.pools.populate(pool, {path: 'amenities.type'})
            .then(pool => {
                ctx.body = {amenities: pool.amenities.map(entities.amenity)};
            });
    }
);

module.exports = router;