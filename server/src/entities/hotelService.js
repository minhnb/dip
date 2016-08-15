'use strict';

const config = require('../config');
const hotelServiceType = require('../constants/hotelServiceType');

function convertService(service) {
    return {
        id: service._id,
        type: service.type.slice(0, service.type.length - 7),
        poolType: service.poolType,
        name: service.name,
        instagram: service.instagram,
        location: service.location,
        details: getHotelServiceDetails(service.type),
        url: service.url,
        lowRate: service.lowRate,
        highRate: service.highRate,
        rating: service.rating.avg,
        ratingCount: service.rating.count,
        imageUrl: service.image.url,
        phone: service.phone,
        roomService: service.roomService,
        reservable: service.reservable,
        amenities: service.amenities,
        policy: service.policy,
        tax: config.taxPercent
    }
}

function getHotelServiceDetails(type) {
    switch (type) {
        case hotelServiceType.SPA_SERVICE:
            return "Spa";
        case hotelServiceType.RESTAURANT_SERVICE:
            return "Restaurant";
        default:
            return "Swimming Pool";
    }
}

module.exports = convertService;