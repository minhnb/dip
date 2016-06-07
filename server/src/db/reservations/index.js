'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Event', 'SpecialOffer', 'Hotel']
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
    price: {
        type: Number,
        required: true
    },
    beforeTax: {
        type: Number,
        required: true
    },
    tax: {
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