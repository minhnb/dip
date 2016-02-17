'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reservationSchema = new Schema({
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