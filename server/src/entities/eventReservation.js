'use strict';

const event = require('./event');
const service = require('./hotelService');

module.exports = function(reservation) {
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
        count: reservation.count
    }
};