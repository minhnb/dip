'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var amenitySchema = new Schema({
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
}, {
    timestamps: true
});

var amenityModel = mongoose.model('Amenity', amenitySchema);

module.exports = amenityModel;