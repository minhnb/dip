'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var entities = require('../../../entities');
var validator = require('../../../validators');

router.get('/', validator.limitParams(), function (ctx) {
    var pool = ctx.state.pool,
        limit = ctx.query.limit ? parseInt(ctx.query.limit) : 100,
        offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;
    return db.amenities.find({ pool: pool }).limit(limit).skip(offset).populate('type').exec().then(function (amenities) {
        ctx.body = { amenities: amenities.map(entities.amenity) };
    });
});

module.exports = router;