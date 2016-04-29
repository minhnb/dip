'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Pool', 'Event']
    },
    user: {
        ref: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true
        },
        email: {
            type: String,
            required: true
        },
        firstName: String,
        lastName: String
    },
    pool: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Pool',
            required: true
        },
        name: String,
        title: String,
        location: String
    },
    price: {
        type: Number,
        required: true
    },
    sale: {
        type: Schema.ObjectId,
        ref: 'Sale'
    },
    promotionDiscount: Number
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

module.exports = mongoose.model('Reservation', ReservationSchema);