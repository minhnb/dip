"use strict";
const router = require('koa-router')();
const pool = require('./pool');

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../validators');
const utils = require('../../helpers/utils');

module.exports = router;

router
    .use('/', auth.authenticate())
    .get('pools', '/',
        validator.pools(),
        validator.offers(),
        ctx => {
            // TODO: Move this to either db or controller module
            var query = db.pools.where("active").equals(true);

            // Filter on location
            if (ctx.query.longitude && ctx.query.latitude) {
                let minDistance = ctx.query.minDistance ? parseFloat(ctx.query.minDistance) : 0,
                    maxDistance = ctx.query.maxDistance ? parseFloat(ctx.query.maxDistance) : 8046.72,
                    center = [parseFloat(ctx.query.longitude), parseFloat(ctx.query.latitude)];
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
                query = query.where('rating.avg').gte(parseFloat(ctx.query.minRating));
            }
            if (ctx.query.maxRating) {
                query = query.where('rating.avg').lte(parseFloat(ctx.query.maxRating));
            }

            // Filter on amenities
            let amenities = ctx.query.amenities;
            if (amenities && Array.isArray(amenities)) {
                query = query.where('amenities.type').in(amenities);
            }

            return query.exec()
                .then(pools => {
                    if (pools.length == 0) {
                        return pools;
                    }
                    // Filter on searchKey (aka, name)
                    if (ctx.query.searchKey) {
                        return db.pools.find({
                            _id: {$in: pools},
                            $text: {$search: ctx.query.searchKey}
                        }).exec();
                    } else {
                        return pools;
                    }
                })
                .then(pools => {
                    if (pools.length == 0) {
                        ctx.body = {pools: []};
                        return;
                    }
                    // Filter on offer
                    let offerOpts = [
                        {pool: {$in: pools.map(p => p._id)}}
                    ];
                    if (ctx.query.date) {
                        offerOpts.push({
                            date: utils.convertDate(ctx.query.date)
                        });
                    }
                    if (ctx.query.timeRanges) {
                        let timeRanges = ctx.query.timeRanges,
                            timeOpts = [];
                        timeRanges.forEach(range => {
                            let startTime = parseInt(range[0]),
                                endTime = parseInt(range[1]);
                            timeOpts.push({
                                'duration.endTime': {$gte: startTime},
                                'duration.startTime': {$lte: endTime}
                            });
                        });
                        offerOpts.push({
                            $or: timeOpts
                        });
                    }
                    if (ctx.query.priceRanges) {
                        let priceRanges = ctx.query.priceRanges,
                            priceOpts = [];
                        priceRanges.forEach(range => {
                            let minPrice = parseInt(range[0]),
                                maxPrice = parseInt(range[1]);
                            priceOpts.push({
                                'ticket.price': {
                                    $gte: minPrice,
                                    $lte: maxPrice
                                }
                            });
                        });
                        offerOpts.push({
                            $or: priceOpts
                        });
                    }
                    if (ctx.query.passTypes) {
                        let types = ctx.query.passTypes,
                            passOpts = [];
                        types.forEach(type => {
                            passOpts.push({'type': type});
                        });
                        offerOpts.push({
                            $or: passOpts
                        });
                    }
                    return db.offers
                        .aggregate([
                            {$match: offerOpts},
                            {$group: {
                                _id: '$pool'
                            }}
                        ])
                        .exec()
                        .then(data => {
                            data = data.map(x => x._id.toString());
                            pools = pools.filter(p => {
                                return data.indexOf(p._id.toString()) >= 0;
                            });
                            if (ctx.query.limit) {
                                let limit = parseInt(ctx.query.limit);
                                if (limit > 0) {
                                    pools.splice(limit);
                                }
                            }
                            ctx.body = {pools: pools.map(entities.pool)};
                        });
                });
        })
    .use('/:poolId',
        (ctx, next) => {
            let id = ctx.params.poolId;
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