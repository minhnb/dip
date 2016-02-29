'use strict';

var mongoose = require('mongoose');
var utils = require('../../helpers/utils');

var Schema = mongoose.Schema;

var cardSchema = new Schema({
    stripeId: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    expMonth: {
        type: Number,
        required: true
    },
    expYear: {
        type: Number,
        required: true
    },
    last4Digits: {
        type: String,
        required: true
    },
    cvcCheck: { // cvcCheck as returned from stripe: pass, fail, unavailable, unchecked
        type: String,
        required: true,
        enum: ['pass', 'fail', 'unavailable', 'unchecked']
    },
    country: { // 2-letter iso code
        type: String,
        required: true
    },
    funding: { // credit, debit, prepaid, unknown
        type: String,
        required: true
    },
    fingerprint: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

cardSchema.virtual('expDate').get(function () {
    return utils.convertCardExpireDate(this.expYear, this.expMonth);
});

cardSchema.virtual('passCvc').get(function () {
    return this.cvcCheck === 'pass';
});

module.exports = cardSchema;