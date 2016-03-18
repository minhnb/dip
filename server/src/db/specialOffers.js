'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const specialOffersSchema = new Schema({
    offer: {
        type: Schema.ObjectId,
        ref: 'Offer',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true,
        default: 1
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('SpecialOffers', specialOffersSchema);