'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = require('../../offers').schema;
const addonSchema = require('../../addons').schema;
const Reservation = require('../../reservations');

const hotelReservationSchema = new Schema({
    hotel: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Hotel',
            required: true
        },
        name: String,
        details: String,
        location: String
    },
    services: [{
        type: Schema.ObjectId,
        ref: 'HotelSubReservation',
        required: true
    }]
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var HotelReservations = Reservation.discriminator('HotelReservation',
  hotelReservationSchema);


module.exports = HotelReservations;