'use strict';

var mongoose = require('mongoose');

var offerSchema = require('./subSchemas/poolOffer');

var Schema = mongoose.Schema;

var pools = new Schema({
    propertyCategory: { type: Number, required: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
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
        _id: {
            type: Schema.ObjectId,
            turnOn: true
        },
        type: { type: Schema.ObjectId, ref: 'AmenityType', required: true }
    }],
    amenitiesString: String,
    active: Boolean,
    title: {
        prefix: String,
        text: String,
        suffix: String
    },
    phone: String,
    reservable: Boolean,
    // Each offer needs to contain enough information so that we can filter for pools based on it
    // Onto more details: filter based on date, start/end time, and price range
    offers: [offerSchema],
    baseOffers: [{
        _id: { type: Schema.ObjectId, turnOn: true },
        name: { type: String, required: true },
        duration: {
            startTime: Number,
            endTime: Number
        },
        allotmentCount: Number,
        tickets: [{
            _id: Schema.ObjectId
        }]
    }],
    tickets: [{
        _id: { type: Schema.ObjectId, turnOn: true },
        price: Number
    }]
}, {
    timestamps: true
});

var poolModel = mongoose.model('Pool', pools);

module.exports = poolModel;