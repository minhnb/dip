'use strict';

const event = require('./event');
const pool = require('./pool');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        email: reservation.user.email,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        userId: reservation.user.ref,
        event: event(reservation.event.ref),
        pool: pool(reservation.event.ref.pool),
        price: reservation.price,
        count: reservation.count
    }
};