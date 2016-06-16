'use strict';

function convertService(service) {
    return {
        id: service._id,
        type: service.type.slice(0, service.type.length - 7),
        name: service.name,
        instagram: service.instagram,
        location: service.location,
        // details: service.details,
        details: "Swimming Pool",//all details must display as Swimming Pool - see http://jira.cvp.io/browse/DIP-162
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
        policy: service.policy
    }
}

module.exports = convertService;