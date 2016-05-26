'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Reservation = require('../../reservations');

const EventReservationSchema = new Schema({
    event: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Event',
            required: true
        },
        title: String,
        location: String
    },
    count: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var EventReservations = Reservation.discriminator('Event',
  EventReservationSchema);

module.exports = EventReservations;