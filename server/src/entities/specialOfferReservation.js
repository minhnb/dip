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
                slots: offer.slots.map(slot => {
                    return {
                        date: slot.date,
                        count: slot.count,
                        total: slot.total
                    }
                }),
                duration: offer.duration
            }
        })
    }
};