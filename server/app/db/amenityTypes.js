'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var amenityTypeSchema = new Schema({
    name: { type: String, required: true },
    details: { type: String, required: true },
    asset: {
        url: String,
        md5: String,
        mediaType: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AmenityType', amenityTypeSchema);