'use strict';

const pool = require('./pool');

function convertSpecialOffer(offer) {
    return {
        id: offer._id,
        name: offer.name,
        description: offer.description,
        imageUrl: offer.image.url,
        instagram: offer.instagram,
        url: offer.url,
        email: offer.email,
        duration: offer.duration,
        price: offer.price,
        pools: offer.pools.map(p => {
            return {
                pool: pool(p.ref),
                allotmentCount: p.allotmentCount,
                startDay: p.startDay,
                endDay: p.endDay,
                duration: p.duration,
                days: p.days
            }  
        })
    }
}

module.exports = convertSpecialOffer;