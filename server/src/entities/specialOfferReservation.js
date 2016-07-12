'use strict';

const event = require('./event');
const offerEntity = require('./offer');
const utils = require('../helpers/utils');

module.exports = function(reservation) {
    if (!reservation) {
        return null;
    }
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
                tax: utils.calculateTax(offer.price * offer.count),
                totalIncludeTax: utils.calculatePriceIncludeTax(offer.price * offer.count),
                host: {
                    id: offer.service._id,
                    name: offer.service.name,
                    location: offer.service.location,
                    details: offer.service.details,
                    displayName: utils.getHotelDisplayName(offer.ref.hotel)
                }
            }
        }),
        createdAt: reservation.createdAt.getTime(),
        promotion: reservation.promotion,
        promotionDiscount: reservation.promotionDiscount || 0,
        tax: reservation.tax,
        beforeTax: reservation.beforeTax
    }
};