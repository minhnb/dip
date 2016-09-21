'use strict';

const hotelService = require('./hotelService');

const utils = require('../helpers/utils');
const db = require('../db');

function convertHotel(hotel, user) {
    let data = {
        id: hotel._id,
        name: hotel.name,
        details: hotel.details,
        location: hotel.location,
        address: hotel.address,
        coordinates: hotel.coordinates ? {
            longitude: hotel.coordinates[0],
            latitude: hotel.coordinates[1]
        } : null,
        imageUrl: hotel.image && hotel.image.url ? hotel.image.url : undefined,
        instagram: hotel.instagram,
        url: hotel.url,
        phone: hotel.phone,
        roomService: hotel.roomService,
        reservable: hotel.reservable,
        services: hotel.services.filter(Boolean).map(s => {
            if (isPopulatedHotelService(s)) {
                return hotelService(s);
            }
            return s;
        }),
        amenities: hotel.amenities,
        featured: hotel.featured,
        distance: hotel.distance,
        dipLocation: hotel.dipLocation,
        active: hotel.active
    };
    if ((user instanceof db.users) && hasPermission(user, hotel)) {
        data.submission = hotel.submission;
        let pendingContent = Object.assign({}, hotel.pendingContent.toObject());
        Object.keys(pendingContent).forEach(key => {
            if (utils.isEmptyObject(pendingContent[key])) {
                delete pendingContent[key];
            }
        });
        data.pendingContent = pendingContent;
        data.hasPendingContent = !utils.isEmptyObject(pendingContent);
    }
    return data;
}

function isPopulatedHotelService(service) {
    if (service._id) {
        return true;
    }
    return false;
}

function hasPermission(user, hotel) {
    return user.isAdmin() || (hotel.owner && hotel.owner.equals(user._id));
}

module.exports = convertHotel;