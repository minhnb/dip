'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var announcementSchema = new Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    details: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);