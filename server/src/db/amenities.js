'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const amenitySchema = new Schema({
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
        required: true
    },
    type: {
        type: Schema.ObjectId,
        ref: 'AmenityType',
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
});

const amenityModel = mongoose.model('Amenity', amenitySchema);

module.exports = amenityModel;