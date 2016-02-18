'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var imageSchema = new Schema({
    url: String,
    md5: String,
    mediaType: String
});

module.exports = imageSchema;