'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const announcementSchema = new Schema({
    title: {type: String, required: true},
    url: {type: String, required: true},
    details: {type: String, required: true}
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);