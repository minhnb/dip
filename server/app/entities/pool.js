'use strict';

function convertPool(pool) {
    return {
        id: pool._id,
        name: pool.name,
        title: pool.title,
        instagram: pool.instagram,
        location: pool.location,
        address: pool.address,
        coordinates: pool.coordinates ? {
            longitude: pool.coordinates[0],
            latitude: pool.coordinates[1]
        } : null,
        propertyCategory: pool.propertyCategory,
        airportCode: pool.airportCode,
        details: pool.details,
        url: pool.url,
        lowRate: pool.lowRate,
        highRate: pool.highRate,
        rating: pool.rating.avg,
        ratingCount: pool.rating.count,
        imageUrl: pool.image.url,
        phone: pool.phone,
        reservable: pool.reservable
    };
}

module.exports = convertPool;