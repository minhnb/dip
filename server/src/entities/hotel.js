'use strict';

const hotelService = require('./hotelService');

function convertHotel(hotel) {
    return {
        id: hotel._id,
        name: hotel.name,
        details: hotel.details,
        location: hotel.location,
        address: hotel.address,
        coordinates: hotel.coordinates ? {
            longitude: hotel.coordinates[0],
            latitude: hotel.coordinates[1]
        } : null,
        imageUrl: hotel.image.url,
        instagram: hotel.instagram,
        url: hotel.url,
        phone: hotel.phone,
        roomService: hotel.roomService,
        reservable: hotel.reservable,
        services: hotel.services.filter(Boolean).map(s => {
           return hotelService(s);
        }),
        amenities: hotel.amenities,
        featured: hotel.featured
    }
}

module.exports = convertHotel;