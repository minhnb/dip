'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const amenitySchema = require('../subSchemas/amenity');

const hotelServiceType = require('../../constants/hotelServiceType');
const utils = require('../../helpers/utils');

const hotelServiceSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: utils.objectToArray(hotelServiceType)
    },
    name: {
        type: String,
        required: true
    },
    details: String,
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
    policy: String,
    deleted: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true,
    discriminatorKey: 'type'
});
hotelServiceSchema.index({name: 'text'});
hotelServiceSchema.pre('find', function () {
    if (this._conditions && this._conditions.deleted == undefined) {
        this._conditions.deleted = false;
    }
});

module.exports = mongoose.model('HotelService', hotelServiceSchema);