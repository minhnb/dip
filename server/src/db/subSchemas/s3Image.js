'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// TODO: Use this inplace of icons/photos/avatars

const imageSchema = new Schema({
    url: String,
    md5: String,
    mediaType: String
});

module.exports = imageSchema;