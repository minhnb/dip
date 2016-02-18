'use strict';

const mongoose = require('mongoose');
const utils = require('../../helpers/utils');

const Schema = mongoose.Schema;

const cardSchema = new Schema({
    stripeToken: {type: String, required: true},
    brand: {type: String, required: true},
    expMonth: {type: Number, required: true},
    expYear: {type: Number, required: true},
    last4Digits: {type: String, required: true},
    cvcCheck: {type: Boolean, required: true}, // pass, fail, unavailable, unchecked
    country: {type: String, required: true}, // 2-letter iso code
    funding: {type: String, required: true} // credit, debit, prepaid, unknown
}, {
    timestamps: true
});

cardSchema.virtual('expDate').get(function() {
    return utils.convertCardExpireDate(this.expYear, this.expMonth);
});

module.exports = cardSchema;