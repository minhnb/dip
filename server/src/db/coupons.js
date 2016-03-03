'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    status: Number,
    code: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    amount: {type: Number, required: true}
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);