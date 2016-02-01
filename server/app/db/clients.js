'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
    identifier: String,
    secret: String,
    name: String,
    website: String,
    redirectUrl: String
}, {
    timestamps: true
});

module.exports = mongoose.model(clientSchema);