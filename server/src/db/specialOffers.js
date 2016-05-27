'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const specialOfferSchema = new Schema({
    hotels: [{
        ref: {
            type: Schema.ObjectId,
            ref: 'Hotel',
            required: true,
        },
        hosts: [{
            type: Schema.ObjectId,
            ref: 'HotelService',
            required: true
        }]
    }],
    name: {
        type: String,
        required: true
    },
    description: String,
    instagram: String,
    email: String,
    url: String,
    image: {
        url: String,
        verified: Boolean
    },
    active: Boolean,
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('SpecialOffer', specialOfferSchema);