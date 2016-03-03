'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const amenitySchema = new Schema({
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

module.exports = amenitySchema;