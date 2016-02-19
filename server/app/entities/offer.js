'use strict';

var amenityEntity = require('./amenity');
var ticketEntity = require('./ticket');

function convertOffer(offer) {
    var obj = {
        id: offer._id,
        description: offer.description,
        allotmentCount: offer.allotmentCount,
        duration: offer.duration,
        amenities: offer.amenities.map(amenityEntity),
        ticket: {
            price: offer.ticket.price,
            ref: offer.ticket.ref ? ticketEntity(offer.ticket.ref) : null
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