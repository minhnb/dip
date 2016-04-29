'use strict';

const event = require('./event');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        email: reservation.user.email,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        userId: reservation.user.ref,
        event: event(reservation.event.ref),
        pool: event(reservation.pool.ref),
        price: reservation.price
    }
};