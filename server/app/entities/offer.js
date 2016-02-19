'use strict';

var ticket = require('./ticket');

function convertOffer(offer) {
    var obj = {
        id: offer._id,
        description: offer.description,
        allotmentCount: offer.allotmentCount,
        duration: offer.duration,
        ticket: {
            price: offer.ticket.price,
            ref: ticket(offer.ticket.ref)
        }
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