'use strict';

const utils = require('../helpers/utils');
const userReport = require('./userReport');

module.exports = function(reservation) {
    if (!reservation) {
        return null;
    }
    let host = {
        id: reservation.event.ref.host._id,
        type: reservation.event.ref.host.type.slice(0, reservation.event.ref.host.type.length - 7),
        name: reservation.event.ref.host.name
    };
    host.displayName = utils.getHotelDisplayName(reservation.event.ref.hotel);
    let result = {
        id: reservation._id,
        event: {
            id: reservation.event.ref._id,
            title: reservation.event.ref.title,
            description: reservation.event.ref.description,
            date: reservation.event.ref.date,
            duration: reservation.event.ref.duration
        },
        host: host,
        price: reservation.price,
        count: reservation.count,
        tax: utils.calculateTax(reservation.price * reservation.count),        
        totalIncludeTax: utils.calculatePriceIncludeTax(reservation.price * reservation.count),
        createdAt: reservation.createdAt.getTime(),
        promotion: reservation.promotion,
        promotionDiscount: reservation.promotionDiscount || 0,
        beforeTax: reservation.beforeTax
    };

    let buyer = userReport(reservation.user.ref);
    result.user = buyer;

    return result;
};