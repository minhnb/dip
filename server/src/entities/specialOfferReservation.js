'use strict';

const event = require('./event');
const offerEntity = require('./offer');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        name: reservation.specialOffer.name,
        price: reservation.price,
        type: reservation.type,
        offers: reservation.offers.map(offer => {
            return {
                ref: offerEntity(offer.ref),
                count: offer.count,
                date: offer.date,
                price: offer.price
            }
        })
    }
};