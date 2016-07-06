'use strict';

const event = require('./event');
const service = require('./hotelService');
const utils = require('../helpers/utils');

module.exports = function(reservation) {
    if (!reservation) {
        return null;
    }
    return {
        id: reservation._id,
        email: reservation.user.email,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        userId: reservation.user.ref,
        event: {
            id: reservation.event.ref._id,
            title: reservation.event.ref.title,
            description: reservation.event.ref.description,
            date: reservation.event.ref.date,
            duration: reservation.event.ref.duration
        },
        host: service(reservation.event.ref.host),
        price: reservation.price,
        count: reservation.count,
        tax: utils.calculateTax(reservation.price * reservation.count),        
        totalIncludeTax: utils.calculatePriceIncludeTax(reservation.price * reservation.count),
        createdAt: reservation.createdAt.getTime()
    }
};