'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var photoSchema = new Schema({
    status: Number,
    source: Number,
    sourceId: String,
    sourceUrl: String,
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
        required: true
    },
    asset: {
        url: String,
        md5: String,
        mediaType: String,
        verified: Boolean
    },
    caption: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Photo', photoSchema);