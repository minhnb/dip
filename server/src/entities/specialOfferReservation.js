'use strict';

const event = require('./event');
const offerEntity = require('./offer');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        name: reservation.specialOffer.name,
        price: reservation.price,
        type: reservation.type.slice(0, reservation.type.length - 11),
        offers: reservation.offers.map(offer => {
            return {
                ref: offerEntity(offer.ref),
                count: offer.count,
                date: offer.date,
                price: offer.price,
                host: {
                    id: offer.service._id,
                    name: offer.service.name,
                    location: offer.service.location,
                    details: offer.service.details
                }
            }
        })
    }
};