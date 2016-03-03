'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const offerTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    icon: {
        url: {
            type: String,
            required: true
        },
        mediaType: {
            type: String
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OfferType', offerTypeSchema);