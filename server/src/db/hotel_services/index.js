'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const amenitySchema = require('../subSchemas/amenity');

const hotelServiceSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['PoolService', 'SpaService', 'RestaurantService']
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
    image: {
        url: String,
        verified: Boolean
    },
    active: Boolean,
    phone: String,
    reservable: Boolean,
    amenities: [{
        type: {type: String},
        count: {
            type: Number,
            default: 0
        },
        details: [{
            label: {type: String},
            price: {type: String}
        }]
    }],
    policy: String
}, {
    timestamps: true,
    discriminatorKey: 'type'
});
hotelServiceSchema.index({name: 'text'});

module.exports = mongoose.model('HotelService', hotelServiceSchema);