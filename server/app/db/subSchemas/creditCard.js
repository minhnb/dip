'use strict';

const mongoose = require('mongoose');
const dateFormat = require('dateFormat');

const Schema = mongoose.Schema;

const cardSchema = new Schema({
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true }
    },
    stripeToken: { type: String, required: true },
    stripeCard: {
        brand: { type: String, required: true },
        expMonth: { type: Number, required: true },
        expYear: { type: Number, required: true },
        lastDigits: { type: String, required: true }
    }
}, {
    timestamps: true
});

cardSchema.virtual('stripeCard.expDate').get(function () {
    return new Date(this.stripeCard.expYear, this.stripeCard.expMonth).toLocaleDateString('%m/%Y');
});

module.exports = cardSchema;