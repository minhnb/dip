"use strict";

var Router = require('koa-router');
var router = Router();
var pool = Router();

var auth = require('../passport_auth');
var validator = require('../input_validator');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

pool.use('/', function (ctx, next) {
    var id = ctx.params.id;
    db.pools.findById(id).exec().then(function (data) {
        ctx.state.pool = data;
        return next();
    }).catch(function (err) {
        ctx.status = 400;
    });
}).get('pool', '/', function (ctx) {
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
    db.photos.find({ pool: pool }).populate('users').limit(limit).skip(offset).exec().then(function (photos) {
        ctx.body = { photos: photos.map(entities.photo) };
    });
}).get('pool offers', '/offers', validator({
    query: {
        date: validator.isDate()
    }
}), function (ctx) {
    var date = ctx.query.date;
    db.pool.find({ _id: ctx.params.id, "offers.date": date }).exec().then(function (pool_data) {
        ctx.body({
            offers: pool_data.offers.map(function (x) {
                return entities.offer(x, pool_data);
            })
        });
    });
});

router.use('/', auth.authenticate()).get('pools', '/', validator({
    query: {
        limit: validator.optional(validator.isInt()),
        longitude: validator.optional(validator.isDecimal()),
        latitude: validator.optional(validator.isDecimal()),
        minDistance: validator.optional(validator.isDecimal()),
        maxDistance: validator.optional(validator.isDecimal()),
        minRating: validator.optional(validator.isDecimal()),
        maxRating: validator.optional(validator.isDecimal()),
        minPrice: validator.optional(validator.isDecimal()),
        maxPrice: validator.optional(validator.isDecimal()),
        date: validator.optional(validator.isDate()),
        startTime: validator.optional(validator.isInt()),
        endTime: validator.optional(validator.isInt())
    }
}), function (ctx) {
    console.log(ctx.query);
    var query = db.pools.where("active").equals(true);

    // Filter on location
    if (ctx.query.longitude && ctx.query.latitude) {
        var minDistance = ctx.query.minDistance || 0,
            maxDistance = ctx.query.maxDistance || 8046.72,
            center = [ctx.query.longitude, ctx.query.latitude];
        var geoOptions = {
            center: center,
            minDistance: minDistance,
            maxDistance: maxDistance,
            spherical: true
        };
        query = query.near(geoOptions);
    }

    // Filter on rating
    if (ctx.query.minRating) {
        query = query.where('rating').gte(ctx.query.minRating);
    }
    if (ctx.query.maxRating) {
        query = query.where('rating').lte(ctx.query.maxRating);
    }

    // Filter on offer
    var offerOpts = {};
    if (ctx.query.date) {
        offerOpts.date = ctx.query.date;
    }
    if (ctx.query.startTime) {
        offerOpts.endTime = { $gt: ctx.query.startTime };
    }
    if (ctx.query.endTime) {
        offerOpts.startTime = { $lt: ctx.query.endTime };
    }
    if (ctx.query.minPrice || ctx.query.maxPrice) {
        var opts = {};
        if (ctx.query.minPrice) opts.$gte = ctx.query.minPrice;
        if (ctx.query.maxPrice) opts.$lte = ctx.query.maxPrice;
        offerOpts['tickets.price'] = opts;
    }
    if (Object.keys(offerOpts).length > 0) {
        query = query.elemMatch('offers', offerOpts);
    }
    if (ctx.query.limit && ctx.query.limit > 0) {
        query = query.limit(limit);
    }
    return query.exec().then(function (pools) {
        ctx.body = { pools: pools.map(entities.pool) };
    });
}).use('/:id', pool.routes(), pool.allowedMethods());