'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dipLocationsSchema = new Schema({
    _id: String,
    name: String,
    description: String,
    order: {
        type: Number,
        required: true,
        default: 1000
    },
    supported: Boolean
});

const DipLocationsModel = mongoose.model('DipLocations', dipLocationsSchema);

module.exports = DipLocationsModel;