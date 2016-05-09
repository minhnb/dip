'use strict';

const event = require('./event');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        name: reservation.name,
        price: reservation.price,
        details: reservation.details.offers.map(offer => {
            return {
                id: offer._id,
                name: offer.name,
                location: offer.location,
                price: offer.price,
                date: offer.date,
                count: offer.count,
                duration: offer.duration
            }
        })
    }
};