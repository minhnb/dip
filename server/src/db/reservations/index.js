'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const promotionTaxTypes = require('../../constants/promotionTaxType');
const utils = require('../../helpers/utils')

const ReservationSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['EventReservation', 'SpecialOfferReservation', 'HotelReservation']
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
    promotionDiscount: Number,
    promotion: {
        code: String,
        taxType: {
            type: String,
            enum: utils.objectToArray(promotionTaxTypes)
        },
        discount: Number
    }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

module.exports = mongoose.model('Reservation', ReservationSchema);