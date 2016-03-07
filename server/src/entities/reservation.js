'use strict';

const user = require('./user');
const offer = require('./offer');

module.exports = function(reservation) {
    return {
        id: reservation._id,
        email: reservation.user.email,
        firstName: reservation.user.firstName,
        lastName: reservation.user.lastName,
        userId: reservation.user.ref,
        pool: reservation.pool,
        offers: reservation.offers.map(o => {
            return {
                details: offer(o.details),
                count: o.count
            };
        }),
        price: reservation.price,
        promotionDiscount: reservation.promotionDiscount,
        saleId: reservation.sale
    }
};