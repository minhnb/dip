'use strict';

var mongoose = require('mongoose');
var dateFormat = require('dateformat');

var Schema = mongoose.Schema;

var cardSchema = new Schema({
    stripeToken: { type: String, required: true },
    brand: { type: String, required: true },
    expMonth: { type: Number, required: true },
    expYear: { type: Number, required: true },
    last4Digits: { type: String, required: true },
    cvcCheck: { type: Boolean, required: true }, // pass, fail, unavailable, unchecked
    country: { type: String, required: true }, // 2-letter iso code
    funding: { type: String, required: true } // credit, debit, prepaid, unknown
}, {
    timestamps: true
});

cardSchema.virtual('expDate').get(function () {
    return dateFormat(new Date(this.expYear, this.expMonth), 'mm/yyyy');
});

module.exports = cardSchema;