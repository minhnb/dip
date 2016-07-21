'use strict';

const userReport = require('./userReport');
const utils = require('../helpers/utils');

module.exports = function(reservation) {
    if (!reservation) {
        return null;
    }
    let result = {
        id: reservation._id,
        hotel: {
            id: reservation.hotel.ref._id,
            name: reservation.hotel.name
        },
        price: reservation.price,
        createdAt: reservation.createdAt.getTime(),
        promotion: reservation.promotion,
        promotionDiscount: reservation.promotionDiscount || 0,
        tax: reservation.tax,
        beforeTax: reservation.beforeTax
    };
    let buyer = userReport(reservation.user.ref);
    result.user = buyer;

    let services = reservation.services.map(s => {
        return {
            id: s._id,
            type: s.service.type.slice(0, s.service.type.length - 7),
            name: s.service.name,
            displayName: utils.getHotelDisplayName(reservation.hotel.ref),
            offers: s.offers.map(offer => {
                return {
                    id: offer.ref._id,
                    description: offer.ref.description,
                    duration: offer.ref.duration,
                    price: offer.price,
                    count: offer.count,
                    date: offer.date,
                    tax: utils.calculateTax(offer.price * offer.count),
                    totalIncludeTax: utils.calculatePriceIncludeTax(offer.price * offer.count)
                }
            })
        }
    });
    result.services = services;

    return result;
};