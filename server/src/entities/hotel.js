'use strict';

const pool = require('./pool');

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
        services: {
            pools: hotel.services.pools.map(p => {
                return {
                    pool: pool(p.ref)
                }
            })
        }
    }
}

module.exports = convertHotel;