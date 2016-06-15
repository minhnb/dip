'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const emailSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    }
});

exports = module.exports = mongoose.model('TestEmail', emailSchema);