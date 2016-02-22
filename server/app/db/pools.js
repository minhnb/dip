'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var poolSchema = new Schema({
    propertyCategory: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    details: String,
    url: String,
    instagram: String,
    lowRate: Number,
    highRate: Number,
    rating: {
        avg: {
            type: Number
        },
        count: {
            type: Number,
            required: true,
            default: 0
        }
    },
    address: {
        airportCode: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    coordinates: {
        type: [Number],
        index: '2dsphere'
    },
    source: Number,
    sourceId: String,
    image: {
        url: String,
        verified: Boolean
    },
    active: Boolean,
    title: {
        prefix: String,
        text: String,
        suffix: String
    },
    phone: String,
    reservable: Boolean
}, {
    timestamps: true
});
poolSchema.index({ name: 'text', 'title.text': 'text' });

var poolModel = mongoose.model('Pool', poolSchema);

module.exports = poolModel;