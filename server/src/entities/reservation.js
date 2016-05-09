'use strict';

const user = require('./user');
const offer = require('./offer');
const userRef = require('./userRef');

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
                count: o.count,
                members: o.members.map(userRef),
                addons: o.addons.map(so => {
                    return {
                        id: so.details._id,
                        name: so.details.name,
                        description: so.details.details,
                        price: so.details.price,
                        count: so.count
                    }
                })
            };
        }),
        price: reservation.price,
        promotionDiscount: reservation.promotionDiscount,
        saleId: reservation.sale
    }
};