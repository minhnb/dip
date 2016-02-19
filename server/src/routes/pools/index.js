"use strict";
const router = require('koa-router')();
const pool = require('./pool');

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../helpers/input_validator');
const utils = require('../../helpers/utils');

module.exports = router;

router
    .use('/', auth.authenticate())
    .get('pools', '/',
        validator({
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
        }),
        ctx => {
            var query = db.pools.where("active").equals(true);

            // Filter on location
            if (ctx.query.longitude && ctx.query.latitude) {
                let minDistance = ctx.query.minDistance || 0,
                    maxDistance = ctx.query.maxDistance || 8046.72,
                    center = [ctx.query.longitude, ctx.query.latitude];
                let geoOptions = {
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

            return query.exec().then(pools => {
                if (pools.length == 0) {
                    ctx.body = {pools: 0};
                    return;
                }
                // Filter on offer
                let offerOpts = {pool: {$in: pools.map(p => p._id)}};
                if (ctx.query.date) {
                    offerOpts.date = utils.convertDate(ctx.query.date);
                }
                if (ctx.query.startTime) {
                    offerOpts.endTime = {$gt: ctx.query.startTime};
                }
                if (ctx.query.endTime) {
                    offerOpts.startTime = {$lt: ctx.query.endTime};
                }
                if (ctx.query.minPrice || ctx.query.maxPrice) {
                    let opts = {};
                    if (ctx.query.minPrice) opts.$gte = ctx.query.minPrice;
                    if (ctx.query.maxPrice) opts.$lte = ctx.query.maxPrice;
                    offerOpts['ticket.price'] = opts;
                }
                console.log('offer filter', offerOpts);
                return db.offers
                    .aggregate([
                        {$match: offerOpts},
                        {$group: {
                            _id: '$pool'
                        }}
                    ])
                    .exec()
                    .then(data => {
                        console.log('got offers');
                        data = data.map(x => x._id.toString());
                        pools = pools.filter(p => {
                            return data.indexOf(p._id.toString()) >= 0;
                        });
                        if (ctx.query.limit && ctx.query.limit > 0) {
                            pools.splice(limit);
                        }
                        ctx.body = {pools: pools.map(entities.pool)};
                    });
            });
        })
    .use('/:id',
        (ctx, next) => {
            let id = ctx.params.id;
            return db.pools.findById(id)
                .exec()
                .then(data => {
                    ctx.state.pool = data;
                    return next();
                });
        },
        pool.routes(),
        pool.allowedMethods()
    );