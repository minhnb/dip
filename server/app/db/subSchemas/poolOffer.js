'use strict';

var mongoose = require('mongoose');
var utils = require('../../helpers/utils');

var Schema = mongoose.Schema;

var offerSchema = new Schema({
    baseId: Schema.ObjectId,
    name: { type: String, required: true },
    date: String,
    reservationCount: Number,
    duration: {
        startTime: Number,
        endTime: Number
    },
    allotmentCount: Number,
    tickets: [{
        _id: Schema.ObjectId,
        price: Number
    }]
});
offerSchema.pre('save', function (next) {
    this.date = utils.convertDate(this.date);
    next();
});

module.exports = offerSchema;