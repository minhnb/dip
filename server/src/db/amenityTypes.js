'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const amenityTypeSchema = new Schema({
    name: {type: String, required: true},
    details: {type: String, required: true},
    asset: {
        url: String,
        md5: String,
        mediaType: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AmenityType', amenityTypeSchema);