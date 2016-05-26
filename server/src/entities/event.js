'use strict';

const hotelService = require('./hotelService');

function convertEvent(event, user) {
    return {
        id: event._id,
        title: event.title,
        description: event.description,
        imageUrl: event.image.url,
        partners: event.partners,
        instagram: event.instagram,
        url: event.url,
        duration: event.duration,
        hotel: event.hotel,
        host: hotelService(event.host),
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