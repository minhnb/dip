"use strict";
const router = require('koa-router')();

const db = require('../../db');
const event = require('./event');
const specialOffer = require('./specialOffer');
const hotel = require('./hotel');
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
        getNearestHotels,
        getEvents,
        getSpecialOffers,
        getHotels,
        response
    )
    .get('get events', '/events',
        getNearestHotels,
        getEvents,
        response
    )
    .get('get special offers', '/offers',
        getNearestHotels,
        getSpecialOffers,
        response
    )
    .get('get hotels', '/hotels',
        getNearestHotels,
        getHotels,
        response
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
    .use('/hotels/:hotelId', 
        (ctx, next) => {
            let id = ctx.params.hotelId;
            return db.hotels.findById(id)
                .populate('services')
                .exec()
                .then(data => {
                    ctx.state.hotel = data;
                    return next();
                });
        },
        hotel.routes(), 
        hotel.allowedMethods()
    )

function getNearestHotels(ctx, next) {
    // TODO: Move this to either db or controller module
    let query = db.hotels.where("active").equals(true);
        query = query.where('reservable').equals(true);
    var p;
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

        p = geocoder.reverse({lat: ctx.query.latitude, lon: ctx.query.longitude})
        .then(function(res) {
            let city = res[0].administrativeLevels.level2long,
                state = res[0].administrativeLevels.level1long;
            return db.cities
                .findOne({'$and': [{city: city}, {state: state}]})
                .exec();
        })
        .then(city => {
            if(!city) {
                ctx.throw(404, 'Not Support');
            }   
        })
    } else {
        p = Promise.resolve();
    };

    return p.then(() => {
        return query.exec()
        .then(nearestHotels => {
            ctx.state.nearestHotels = nearestHotels;
            return next();
        })
    })
}

function getEvents(ctx, next) {
    let hotelIds = ctx.state.nearestHotels.map(hotel => hotel._id);
    let query = db.events.where("active").equals(true);
    //TODO: add search and filter function
    return query
    .find({hotel: {$in: hotelIds}})
    .populate('host')
    .exec()
    .then(events => {
        ctx.state.events = events.map(event => entities.event(event, ctx.state.user));
        return next();
    })
}

function getSpecialOffers(ctx, next) {
    let hotelIds = ctx.state.nearestHotels.map(hotel => hotel._id);
    let query = db.specialOffers.where("active").equals(true);
    return query
    .find({'hotels.ref': {$in: hotelIds}})
    .populate({
        path: 'hotels.ref',
        model: db.hotels
    })
    .populate({
        path: 'hotels.hosts',
        model: db.hotelServices
    })
    .exec()
    .then(specialOffers => {
        ctx.state.specialOffers = specialOffers.map(entities.specialOffers);
        return next();
    })
}

function getHotels(ctx, next) {
    let query = db.hotels.where("active").equals(true);
        query = query.where('reservable').equals(true);

    let conditions = {},
        nearestHotels = ctx.state.nearestHotels;
    conditions['_id'] = {$in: nearestHotels};
    // Filter on searchKey (aka, name)
    if (ctx.query.searchKey) {
        conditions['$text'] = {$search: ctx.query.searchKey};
    }

    let indexMapping = Object.create(null);
    nearestHotels.forEach((hotel, index) => {
        indexMapping[hotel.id] = index;
    });

    return query
    .find(conditions)
    .populate({
        path: 'services',
        model: db.hotelServices
    })
    .exec()
    .then(hotels => {
        hotels = hotels.sort((h1, h2) => {
            return indexMapping[h1.id] - indexMapping[h2.id];
        });
        ctx.state.hotels = hotels.map(entities.hotel);
        return next();
    })
}


function response(ctx) {
    ctx.state.responseData = {};
    // if(ctx.state.pools) {
    //     ctx.state.responseData.pools = ctx.state.pools
    // }
    if(ctx.state.events) {
        ctx.state.responseData.events = ctx.state.events
    }
    if(ctx.state.specialOffers) {
        ctx.state.responseData.specialOffers = ctx.state.specialOffers
    }
    if(ctx.state.hotels) {
        ctx.state.responseData.hotels = ctx.state.hotels
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


