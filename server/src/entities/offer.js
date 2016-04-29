'use strict';

const amenityEntity = require('./amenity');
const ticketEntity = require('./ticket');
const specialOfferEntity = require('./specialOffer');

function convertOfferType(type) {
    return {
        id: type._id,
        name: type.name,
        icon: type.icon
    }
}

function convertOffer(offer) {
    var obj = {
        id: offer._id,
        description: offer.description,
        allotmentCount: offer.allotmentCount,
        duration: offer.duration,
        capacity: offer.capacity,
        amenities: offer.amenities.map(amenityEntity.base),
        specialOffers: offer.specialOffers.map(specialOfferEntity),
        ticket: {
            price: offer.ticket.price,
            ref: offer.ticket.ref ? ticketEntity(offer.ticket.ref) : null
        },
        type: convertOfferType(offer.type)
    };

    if (offer.date) {
        obj.date = offer.date;
    }
    if (offer.reservationCount) {
        obj.reservationCount = offer.reservationCount;
    }

    return obj;
}
convertOffer.type = convertOfferType;

module.exports = convertOffer;