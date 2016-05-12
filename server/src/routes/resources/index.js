"use strict";
const router = require('koa-router')();

const db = require('../../db');
const pool = require('./pool');
const event = require('./event');
const specialOffer = require('./specialOffer');
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
    .get('get resources', '/',
        getNearestPools,
        getPools,
        getEvents,
        getSpecialOffers,
        response
    )
    .get('get pools', '/pools',
        getNearestPools,
        getPools,
        response
    )
    .get('get events', '/events',
        getNearestPools,
        getEvents,
        response
    )
    .get('get special offers', '/offers',
        getNearestPools,
        getSpecialOffers,
        response
    )
    .use('/pools/:poolId',
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
    )
    .use('/events/:eventId', 
        (ctx, next) => {
            let id = ctx.params.eventId;
            return db.events.findById(id)
                .exec()
                .then(data => {
                    ctx.state.event = data;
                    return next();
                });
        },
        event.routes(), 
        event.allowedMethods()
    )
    .use('/offers/:specialOfferId', 
        (ctx, next) => {
            let id = ctx.params.specialOfferId;
            return db.specialOffers.findById(id)
                .exec()
                .then(data => {
                    ctx.state.specialOffer = data;
                    return next();
                });
        },
        specialOffer.routes(), 
        specialOffer.allowedMethods()
    )

function getNearestPools(ctx, next) {
    // TODO: Move this to either db or controller module
    let query = db.pools.where("active").equals(true);
        query = query.where('reservable').equals(true);
    // var p;
    // Filter on location
    if (ctx.query.longitude && ctx.query.latitude) {
        let minDistance = ctx.query.minDistance ? parseFloat(ctx.query.minDistance) : 0,
            maxDistance = ctx.query.maxDistance ? parseFloat(ctx.query.maxDistance) : 190000,
            center = [parseFloat(ctx.query.longitude), parseFloat(ctx.query.latitude)];
        let geoOptions = {
            center: {
                type: 'Point',
                coordinates: center
            },
            minDistance: minDistance,
            maxDistance: maxDistance,
            spherical: true
        };

        query = query.where('coordinates').near(geoOptions);
        // p = geocoder.reverse({lat: ctx.query.latitude, lon: ctx.query.longitude})
        // .then(function(res) {
        //     let city = res[0].administrativeLevels.level2long,
        //         state = res[0].administrativeLevels.level1long;
        //     return db.cities
        //         .findOne({'$and': [{city: city}, {state: state}]})
        //         .exec();
        // })
        // .then(city => {
        //     // if(!city) {
        //     //     ctx.throw(404, 'Not Support');
        //     // }   
        // })
    } 
    return query.exec()
    .then(nearestPools => {
        ctx.state.nearestPools = nearestPools;
        return next();
    })
    // else {
    //     p = Promise.resolve();
    // }
    // return p.then(() => {
    //     return query.exec()
    //     .then(nearestPools => {
    //         ctx.state.nearestPools = nearestPools;
    //         return next();
    //     })
    // })
}

function getPools(ctx, next) {
    let query = db.pools.where("active").equals(true);
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

    let conditions = {};
    conditions['_id'] = {$in: ctx.state.nearestPools};
    // Filter on searchKey (aka, name)
    if (ctx.query.searchKey) {
        conditions['$text'] = {$search: ctx.query.searchKey};
    }

    return query
    .find(conditions)
    .exec()
    // .then(pools => {
    //     if (pools.length == 0) {
    //         return pools;
    //     }
    // })
    .then(pools => {
        if (pools.length == 0) {
            ctx.state.pools = [];
            return next();
        }
        if(!ctx.query.date && !ctx.query.timeRanges && !ctx.query.priceRanges && !ctx.query.passTypes) {
            // ctx.body = {pools: pools.map(entities.pool)};
            // return; 
            ctx.state.pools = pools.map(entities.pool);
            return next();

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
                ctx.state.pools = pools.map(entities.pool);
                return next();
            });
    });
}

function getEvents(ctx, next) {
    let poolIds = ctx.state.nearestPools.map(pool => pool.id);
    let query = db.events.where("active").equals(true);
    //TODO: add search and filter function
    return query
    .find({pool: {$in: poolIds}})
    .populate('pool')
    .exec()
    .then(events => {
        ctx.state.events = events.map(event => entities.event(event, ctx.state.user));
        return next();
    })
}

function getSpecialOffers(ctx, next) {
    let poolIds = ctx.state.nearestPools.map(pool => pool.id);
    let query = db.specialOffers.where("active").equals(true);
    return query
    .find({'pools.ref': {$in: poolIds}})
    .populate('pools.ref')
    .exec()
    .then(specialOffers => {
        ctx.state.specialOffers = specialOffers.map(entities.specialOffers);
        return next();
    })
}


function response(ctx) {
    ctx.state.responseData = {};
    if(ctx.state.pools) {
        ctx.state.responseData.pools = ctx.state.pools
    }
    if(ctx.state.events) {
        ctx.state.responseData.events = ctx.state.events
    }
    if(ctx.state.specialOffers) {
        ctx.state.responseData.specialOffers = ctx.state.specialOffers
    }
    ctx.body = ctx.state.responseData;
}

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

