'use strict';

function convertService(service) {
    return {
        id: service._id,
        type: service.type,
        name: service.name,
        instagram: service.instagram,
        location: service.location,
        details: service.details,
        url: service.url,
        lowRate: service.lowRate,
        highRate: service.highRate,
        rating: service.rating.avg,
        ratingCount: service.rating.count,
        imageUrl: service.image.url,
        phone: service.phone,
        roomService: service.roomService,
        reservable: service.reservable,
        amenities: service.amenities
    }
}

module.exports = convertService;