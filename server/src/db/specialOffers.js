'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const specialOffersSchema = new Schema({
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
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
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('SpecialOffer', specialOffersSchema);