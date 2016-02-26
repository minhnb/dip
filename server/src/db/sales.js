'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = require('./subSchemas/creditCard');

const saleSchema = new Schema({
    state: {
        type: String,
        required: true
    },
    stripe: {
        customerId: {
            type: String,
            required: true
        },
        cardInfo: {
            type: cardSchema,
            required: true
        }
    },
    error: String,
    amount: Number,
    feeAmount: Number,
    reservation: {
        type: Schema.ObjectId,
        ref: 'Reservation',
        required: true
    }
});

module.exports = mongoose.model('Sale', saleSchema);