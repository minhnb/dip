'use strict';

const poolRef = require('./poolRef');
const ticket = require('./ticket');

function convertOffer(offer, pool) {
    var obj = {
        id: offer._id,
        allotmentCount: offer.allotmentCount,
        duration: offer.duration,
        tickets: offer.tickets.map(function(x){return ticket(x, pool);})
    };

    if (offer.date) {
        obj.date = offer.date;
    }
    if (offer.reservationCount) {
        obj.reservationCount = offer.reservationCount;
    }

    return obj;
}

module.exports = convertOffer;