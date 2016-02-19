'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// TODO: Use this inplace of icons/photos/avatars

var imageSchema = new Schema({
    url: String,
    md5: String,
    mediaType: String
});

module.exports = imageSchema;