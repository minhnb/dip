'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const amenitySchema = require('./subSchemas/amenity');

const hotelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: false
    },
    details: String,
    url: String,
    instagram: String,
    address: {
        airportCode: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        timezone: String,
        neighborhood: String
    },
    coordinates: {
        type: [Number],
        index: '2dsphere'
    },
    image: {
        url: String,
        verified: Boolean
    },
    active: Boolean,
    phone: String,
    roomService: String,
    reservable: Boolean,
    amenities: [String],
    services: [{
        type: Schema.ObjectId,
        ref: 'HotelService'
    }],
    featured: {
        type: Boolean,
        require: true,
        default: false
    },
    dipLocation: String,
    emails: {
        reservation: [{
            email: {
                type: String,
                lowercase: true,
                required: true
            },
            name: String
        }]
    }
}, {
    timestamps: true
});
hotelSchema.index({name: 'text'});

const hotelModel = mongoose.model('Hotel', hotelSchema);

module.exports = hotelModel;