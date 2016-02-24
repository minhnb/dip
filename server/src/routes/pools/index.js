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
                    let offerOpts = {pool: {$in: pools.map(p => p._id)}};
                    if (ctx.query.date) {
                        offerOpts.date = utils.convertDate(ctx.query.date);
                    }
                    if (ctx.query.startTime) {
                        let startTime = parseInt(ctx.query.startTime);
                        offerOpts['duration.startTime'] = {$gte: startTime};
                    }
                    if (ctx.query.endTime) {
                        let endTime = parseInt(ctx.query.endTime);
                        offerOpts['duration.endTime'] = {$lte: endTime};
                    }
                    if (ctx.query.minPrice || ctx.query.maxPrice) {
                        let opts = {};
                        if (ctx.query.minPrice) opts.$gte = parseFloat(ctx.query.minPrice);
                        if (ctx.query.maxPrice) opts.$lte = parseFloat(ctx.query.maxPrice);
                        offerOpts['ticket.price'] = opts;
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