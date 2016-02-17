'use strict';

var mongoose = require('mongoose');
var dateFormat = require('dateformat');

var Schema = mongoose.Schema;

var cardSchema = new Schema({
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
    return dateFormat(new Date(this.stripeCard.expYear, this.stripeCard.expMonth), 'mm/yyyy');
});

module.exports = cardSchema;