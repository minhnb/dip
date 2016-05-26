'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const specialOfferSchema = require('../../specialOffers').schema;
const Reservation = require('../../reservations');

const specialOfferReservationSchema = new Schema({
    name: String,
    details: {
        ref: {
            type: Schema.ObjectId,
            ref: 'SpecialOffer',
            required: true
        },
        offers: [{
            pool: {
                type: Schema.ObjectId,
                ref: 'Pool',
                required: true
            },
            name: String,
            location: String,
            duration: {
                startTime: {
                    type: Number,
                    required: true
                },
                endTime: {
                    type: Number,
                    required: true
                }
            },
            slots: [{
                date: String,
                count: Number,
                total: Number
            }],
            price: Number
        }]
    }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var specialOfferReservation = Reservation.discriminator('SpecialOffer',
  specialOfferReservationSchema);


module.exports = specialOfferReservation;