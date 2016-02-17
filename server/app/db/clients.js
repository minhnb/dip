'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var clientSchema = new Schema({
    identifier: String,
    secret: String,
    name: String,
    website: String,
    redirectUrl: String
}, {
    timestamps: true
});

module.exports = mongoose.model(clientSchema);