'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    date: Date,
    user: { type: Schema.ObjectId, ref: 'User' },
    pool: { type: Schema.ObjectId, ref: 'Pool' },
    offer: { type: Schema.ObjectId },
    tickets: [{
        ticket: { type: Schema.ObjectId },
        price: Number
    }],
    price: Number // why?
});

module.exports = mongoose.model('Reservation', reservationSchema);