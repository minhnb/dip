"use strict";
const router = require('koa-router')();
const pool = require('./pool');

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../validators');
const utils = require('../../helpers/utils');

var geocoderProvider = 'google';
var httpAdapter = 'http';

const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

module.exports = router;

router
    .use('/', auth.authenticate())
    .get('pools', '/',
        validator.pools(),
        validator.offers(),
        ctx => {
            // TODO: Move this to either db or controller module
            var query;
            var p;
            // Filter on location
            if (ctx.query.longitude && ctx.query.latitude) {
                let maxDistance = ctx.query.maxDistance ? parseFloat(ctx.query.maxDistance) : 190000,
                    center = [parseFloat(ctx.query.longitude), parseFloat(ctx.query.latitude)];
                //let geoOptions = {
                //    center: {
                //        type: 'Point',
                //        coordinates: center
                //    },
                //    maxDistance: maxDistance,
                //    spherical: true
                //};

                query = db.pools.find({
                    active: true,
                    coordinates: {
                        $nearSphere: {
                            $geometry: {
                                type: 'Point',
                                coordinates: center
                            },
                            $maxDistance: maxDistance
                        }
                    }
                });
                
                p = geocoder.reverse({lat: ctx.query.latitude, lon: ctx.query.longitude})
                .then(function(res) {
                    let city = res[0].administrativeLevels.level2long,
                        state = res[0].administrativeLevels.level1long;
                    return db.cities
                        .findOne({'$and': [{city: city}, {state: state}]})
                        .exec();
                })
                .then(city => {
                    // if(!city) {
                    //     ctx.throw(404, 'Not Support');
                    // }   
                })
            } else {
                query = db.pools.find({
                    active: true
                });
                p = Promise.resolve();
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

            return p.then(() => {
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
                        if(!ctx.query.date && !ctx.query.timeRanges && !ctx.query.priceRanges && !ctx.query.passTypes) {
                            ctx.body = {pools: pools.map(entities.pool)};
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
                            offerOpts.push(filterTimeRanges(ctx.query.timeRanges));
                        }
                        if (ctx.query.priceRanges) {
                            offerOpts.push(filterPriceRanges(ctx.query.priceRanges));
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
                                {
                                    $match: {$and: offerOpts}
                                },
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

function filterTimeRanges(input) {
    if (!input) return null;
    if (!Array.isArray(input)) {
        input = [input];
    }
    let timeOpts = [];
    input.forEach(range => {
        let startTime, endTime;
        if (Array.isArray(range)) {
            startTime = parseInt(range[0]);
            endTime = parseInt(range[1]);
        } else {
            switch (range) {
                case 'morning':
                    startTime = 360;
                    endTime = 600;
                    break;
                case 'daytime':
                    startTime = 600;
                    endTime = 1020;
                    break;
                case 'evening':
                    startTime = 1020;
                    endTime = 1260;
                    break;
                case 'late':
                    startTime = 1260;
                    endTime = 1560;
                    break;
                default:
                    // do nothing
                    return;
            }
        }
        timeOpts.push({
            'duration.endTime': {$gte: startTime},
            'duration.startTime': {$lte: endTime}
        });
    });
    return {
        $or: timeOpts
    };
}

function filterPriceRanges(input) {
    if (!input) return null;
    if (!Array.isArray(input)) {
        input = [input];
    }
    let priceOpts = [];
    input.forEach(range => {
        let minPrice, maxPrice;
        if (Array.isArray(range)) {
            minPrice = parseInt(range[0]);
            maxPrice = parseInt(range[1]);
        } else {
            switch (range) {
                case '$':
                    minPrice = 1000;
                    maxPrice = 2000;
                    break;
                case '$$':
                    minPrice = 2000;
                    maxPrice = 4000;
                    break;
                case '$$$':
                    minPrice = 4000;
                    maxPrice = 8000;
                    break;
                default:
                    // do nothing
                    return;
            }
        }
        priceOpts.push({
            'ticket.price': {
                $gte: minPrice,
                $lte: maxPrice
            }
        });
    });
    return {
        $or: priceOpts
    };
}