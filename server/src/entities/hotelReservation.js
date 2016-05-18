'use strict';

const pool = require('./pool');
const offerEntity = require('./offer');
const addonEntity = require('./addon');
module.exports = function(reservation) {
    return {
        id: reservation._id,
        type: reservation.type,
        hotel: {
            id: reservation.hotel._id,
            name: reservation.hotel.name,
            description: reservation.hotel.description,
            location: reservation.hotel.location
        },
        services: {
            pools: reservation.services.pools.map(data => {
                return {
                    pool: data.pool,
                    offers: data.offers.map(offer => {
                        return {
                            ref: offerEntity(offer.ref),
                            price: offer.price,
                            count: offer.count,
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
                
            })
        },
        price: reservation.price
    }
};