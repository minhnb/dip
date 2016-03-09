'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const citiesSchema = new Schema({
    city: String,
    state: String
});

const CitiesModel = mongoose.model('City', citiesSchema);

module.exports = CitiesModel;