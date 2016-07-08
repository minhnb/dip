'use strict';

const hotelService = require('./hotelService');
const utils = require('../helpers/utils');

function convertEvent(event, user) {
    if (!event) {
        return;
    }
    let host = hotelService(event.host);
    let hotel = event.hotel;
    if (hotel._id) {
        hotel = hotel.id;
        host.displayName = utils.getHotelDisplayName(event.hotel);
    }
    return {
        id: event._id,
        title: event.title,
        description: event.description,
        imageUrl: event.image.url,
        partners: event.partners,
        instagram: event.instagram,
        url: event.url,
        duration: event.duration,
        hotel: hotel,
        host: host,
        email: event.email,
        price: event.price,
        date: event.date,
        capacity: event.capacity,
        reservationCount: event.reservationCount,
        isJoined: (user && event.members.some(m => m.equals(user._id))),
        isFull: event.capacity == event.reservationCount ? true : false
    }
}

module.exports = convertEvent;