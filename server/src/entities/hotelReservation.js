'use strict';

const pool = require('./pool');
const offerEntity = require('./offer');
const addonEntity = require('./addon');
const utils = require('../helpers/utils');

module.exports = function(reservation) {
    if (!reservation) {
        return null;
    }
    return {
        id: reservation._id,
        type: reservation.type.slice(0, reservation.type.length - 11),
        hotel: {
            id: reservation.hotel.ref._id,
            displayName: utils.getHotelDisplayName(reservation.hotel.ref),
            name: reservation.hotel.ref.name,
            address: reservation.hotel.ref.address,
            description: reservation.hotel.details,
            imageUrl: reservation.hotel.ref.image.url
        },
        services: reservation.services.map(s => {
            return {
                id: s._id,
                type: s.service.type.slice(0, s.service.type.length - 7),
                name: s.service.name,
                displayName: utils.getHotelDisplayName(reservation.hotel.ref),
                location: s.service.location,
                offers: s.offers.map(offer => {
                    return {
                        ref: offerEntity(offer.ref),
                        price: offer.price,
                        duration: getOfferDuration(offer),
                        count: offer.count,
                        date: offer.date,
                        tax: utils.calculateTax(offer.price * offer.count),
                        totalIncludeTax: utils.calculatePriceIncludeTax(offer.price * offer.count),
                        addons: offer.addons.map(addon => {
                            return {
                                ref: addonEntity(addon.ref),
                                count: addon.count,
                                price: addon.price
                            }         
                        })
                    }
                })
            }
        }),
        price: reservation.price,
        createdAt: reservation.createdAt.getTime(),
        promotion: reservation.promotion,
        promotionDiscount: reservation.promotionDiscount || 0,
        tax: reservation.tax,
        beforeTax: reservation.beforeTax
    }
};

function getOfferDuration(offer) {
    if (!offer.duration || !Number.isFinite(offer.duration.startTime)) {
        return offer.ref.duration;
    } else return offer.duration;
}