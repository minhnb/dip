'use strict';

const pool = require('./pool');
const offerEntity = require('./offer');
const addonEntity = require('./addon');
module.exports = function(reservation) {
    return {
        id: reservation._id,
        type: reservation.type.slice(0, reservation.type.length - 11),
        hotel: {
            id: reservation.hotel.ref._id,
            name: reservation.hotel.name,
            description: reservation.hotel.description,
            location: reservation.hotel.location
        },
        services: reservation.services.map(s => {
            return {
                id: s._id,
                type: s.service.type.slice(0, s.service.type.length - 7),
                name: s.service.name,
                location: s.service.location,
                offers: s.offers.map(offer => {
                    return {
                        ref: offerEntity(offer.ref),
                        price: offer.price,
                        count: offer.count,
                        date: offer.date,
                        addons: offer.addons.map(addon => {
                            return {
                                ref: addonEntity(addon.ref),
                                count: addon.count,
                                price: addon.price
                            }         
                        })
                    }
                })
            }
        }),
        price: reservation.price
    }
};