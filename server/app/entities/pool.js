'use strict';

const offer = require('./offer');

function convertPool(pool) {
    return {
        id: pool._id,
        name: pool.name,
        title: pool.title,
        location: pool.location,
        address: pool.address,
        coordinates: pool.coordinates,
        propertyCategory: pool.propertyCategory,
        airportCode: pool.airportCode,
        details: pool.details,
        url: pool.url,
        lowRate: pool.lowRate,
        highRate: pool.highRate,
        rating: pool.rating,
        imageUrl: pool.image.url,
        phone: pool.phone,
        amenities: pool.amenitiesString,
        reservable: pool.reservable,
        defaultOffers: pool.baseOffers.map(function (x) {
            return offer(x, pool);
        })
    };
}

module.exports = convertPool;