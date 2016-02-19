'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

router.get('/',
    validator.limitParams(),
    ctx => {
        let pool = ctx.state.pool,
            limit = ctx.query.limit ? parseInt(ctx.query.limit) : 100,
            offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;
        return db.amenities.find({pool: pool})
            .limit(limit)
            .skip(offset)
            .populate('type')
            .exec()
            .then(amenities => {
                ctx.body = {amenities: amenities.map(entities.amenity)};
            });
    }
);

module.exports = router;