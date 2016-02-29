'use strict';

var user = require('./user');
var offer = require('./offer');

module.exports = function (reservation) {
    return {
        id: reservation._id,
        email: reservation.user.email,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        userId: reservation.user.ref,
        pool: reservation.pool,
        offers: reservation.offers.map(function (o) {
            return {
                details: offer(o.details),
                count: o.count
            };
        }),
        price: reservation.price,
        saleId: reservation.sale
    };
};