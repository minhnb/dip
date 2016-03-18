'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const amenityTypeSchema = new Schema({
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'pool',
        enum: ['pool', 'hotel', 'fare']
    },
    icon: {
        url: {
            type: String,
            required: true
        },
        mediaType: {
            type: String,
            required: true
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AmenityType', amenityTypeSchema);