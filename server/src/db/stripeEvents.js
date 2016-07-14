'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    eventId: {
        type: String,
        required: true,
        index: { unique: true }
    }
});

exports = module.exports = mongoose.model('StripeEvent', eventSchema);