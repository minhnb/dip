'use strict';

const amenityEntity = require('./amenity');
const ticketEntity = require('./ticket');
const addonEntity = require('./addon');

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
        addons: offer.addons.map(addonEntity),
        // ticket: {
        //     price: offer.ticket.price,
        //     ref: offer.ticket.ref ? ticketEntity(offer.ticket.ref) : null
        // },
        price: offer.price,
        type: isPopulatedOfferType(offer.type) ? convertOfferType(offer.type) : offer.type,
        service: offer.service,
        hotel: offer.hotel,
        passType: offer.passType,
        title: offer.title,
        days: offer.days,
        startDay: offer.startDay,
        dueDay: offer.dueDay,
        offDays: offer.offDays,
    };

    if (offer.reservationCount) {
        obj.reservationCount = offer.reservationCount[offer.date] ? offer.reservationCount[offer.date]: 0;
    }

    return obj;
}

function isPopulatedOfferType(type) {
    if (type._id) {
        return true;
    }
    return false;
}

convertOffer.type = convertOfferType;

module.exports = convertOffer;