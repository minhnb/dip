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
        hotels: offer.hotels.map(hotel => {
            return {
                hotel: {
                    id: hotel.ref._id,
                    name: hotel.ref.name,
                    details: hotel.ref.details,
                    location: hotel.ref.location,
                    address: hotel.ref.address
                },
                hosts: hotel.hosts.map(host => {
                    return {
                        host: hotelService(host.ref),
                        days: host.days,
                        duration: host.duration,
                        allotmentCount: host.allotmentCount,
                        reservationCount: host.reservationCount
                    }    
                })
            }   
        })
    }
}

module.exports = convertSpecialOffer;