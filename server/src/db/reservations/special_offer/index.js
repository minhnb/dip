'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const specialOfferSchema = require('../../specialOffers').schema;
const Reservation = require('../../reservations');

const specialOfferReservationSchema = new Schema({
    specialOffer: {
        ref: {
            type: Schema.ObjectId,
            ref: 'SpecialOffer',
            required: true
        },
        name: String
    },
    offers: [{
        ref: {
            type: Schema.ObjectId,
            ref: 'Offer',
            required: true
        },
        count: {
            type: Number,
            required: true,
            default: 1
        },
        date: {
            type: String,
            required: true
        },
        service: {
            type: Schema.ObjectId,
            ref: 'HotelService',
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var specialOfferReservation = Reservation.discriminator('SpecialOffer',
  specialOfferReservationSchema);


module.exports = specialOfferReservation;