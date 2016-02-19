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
    rating: Number,
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
    amenities: [{
        type: {
            type: Schema.ObjectId,
            ref: 'AmenityType',
            required: true
        },
        count: {
            type: Number,
            required: true,
            default: 1
        }
    }],
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

var poolModel = mongoose.model('Pool', poolSchema);

module.exports = poolModel;