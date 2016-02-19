'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var entities = require('../../../entities');

var validator = require('../../../helpers/input_validator');
var utils = require('../../../helpers/utils');

router.get('pool', '/', function (ctx) {
    ctx.body = { pool: entities.pool(ctx.state.pool) };
}).get('pool photos', '/photos', validator({
    request: {
        query: {
            limit: validator.optional(validator.isInt()),
            offset: validator.optional(validator.isInt())
        }
    }
}), function (ctx) {
    var pool = ctx.state.pool,
        limit = ctx.query.limit || 100,
        offset = ctx.query.offset || 0;
    return db.photos.find({ pool: pool }).populate('user').limit(limit).skip(offset).exec().then(function (photos) {
        ctx.body = { photos: photos.map(entities.photo) };
    });
}).get('pool offers', '/offers', validator({
    query: {
        date: validator.isDate()
    }
}), function (ctx) {
    var date = ctx.query.date,
        pool = ctx.state.pool;
    return db.offers.find({
        pool: pool,
        date: utils.convertDate(date)
    }).populate('ticket.ref').exec().then(function (offers) {
        ctx.body = offers.map(entities.offer);
    });
    //return db.pool.find({_id: ctx.params.id, "offers.date": utils.convertDate(date)}).exec().then(function(pool_data) {
    //    ctx.response.body = {
    //        offers: pool_data.offers.map(x => {
    //            return entities.offer(x, pool_data);
    //        })
    //    };
    //});
});

module.exports = router;