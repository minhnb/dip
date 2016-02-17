'use strict';

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var couponSchema = new Schema({
    status: Number,
    code: { type: String, required: true },
    percentOff: { type: Number, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);