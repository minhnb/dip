'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router.get('/',
    ctx => {
        let pool = ctx.state.pool;
        return pool.amenities.populate('type')
            .exec()
            .then(() => {
                ctx.body = {amenities: pool.amenities.map(entities.amenity)};
            });
    }
);

module.exports = router;