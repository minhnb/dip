'use strict';

const poolRef = require('./poolRef');
const offer = require('./offer');

function convertAvailability(availability) {
    //availability.populate('pool');
    return {
        id: availability._id,
        pool: poolRef(availability.pool),
        reservationCount: availability.reservationCount,
        allotmentCount: availability.allotmentCount,
        offers: availability.offers.map(offer),
        date: availability.date,
        duration: availability.duration
    };
}

module.exports = convertAvailability;