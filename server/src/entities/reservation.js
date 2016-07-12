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
        details: {
            pool: reservation.details.pool,
            offers: reservation.details.offers.map(o => {
                return {
                    ref: offer(o.ref),
                    count: o.count,
                    price: o.price,
                    members: o.members.map(userRef),
                    addons: o.addons.map(so => {
                        return {
                            id: so.ref._id,
                            name: so.ref.name,
                            description: so.ref.details,
                            price: so.price,
                            count: so.count
                        }
                    })
                };
            })
        },
        price: reservation.price,
        promotionDiscount: reservation.promotionDiscount,
        saleId: reservation.sale,
        promotion: reservation.promotion
    }
};