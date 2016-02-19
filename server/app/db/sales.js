'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var saleSchema = new Schema({
    state: String,
    stripe: {
        id: String,
        token: String,
        customerId: String
    },
    user: { type: Schema.ObjectId, ref: 'User' },
    reservation: { type: Schema.ObjectId, ref: 'Reservation' },
    card: {
        lastDigits: String,
        expiration: Date,
        type: String,
        address: String
    },
    error: String,
    amount: Number,
    feeAmount: Number,
    coupon: { type: Schema.ObjectId, ref: 'Coupon' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);