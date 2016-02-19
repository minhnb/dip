'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var amenityTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    icon: {
        url: {
            type: String,
            required: true
        },
        md5: {
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