'use strict';

const hotelService = require('./hotelService');
const hotel = require('./hotel');

function convertSpecialOffer(offer) {
    return {
        id: offer._id,
        name: offer.name,
        description: offer.description,
        imageUrl: offer.image.url,
        instagram: offer.instagram,
        url: offer.url,
        email: offer.email,
        duration: offer.duration,
        price: offer.price,
        hosts: offer.hotels.reduce((arr, hotel) => {
            return arr.concat(hotel.hosts.map(host => {
                return {
                    hotel: {
                        id: hotel.ref._id,
                        name: hotel.ref.name,
                        details: hotel.ref.details,
                        location: hotel.ref.location,
                        address: hotel.ref.address
                    }, 
                    host: hotelService(host.ref),
                    days: host.days,
                    duration: host.duration,
                    allotmentCount: host.allotmentCount,
                    reservationCount: host.reservationCount

                }
            }));
        }, [])
    }
}

module.exports = convertSpecialOffer;