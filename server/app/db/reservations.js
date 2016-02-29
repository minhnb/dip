'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var offerSchema = require('./offers').schema;
var couponSchema = require('./coupons').schema;

var reservationSchema = new Schema({
    user: {
        ref: {
            type: Schema.ObjectId,
            ref: 'User',
            required: true
        },
        email: {
            type: String,
            required: true
        },
        firstName: String,
        lastName: String
    },
    friends: [{
        type: Schema.ObjectId,
        ref: 'User'
    }],
    pool: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Pool',
            required: true
        },
        name: String,
        title: String,
        location: String
    },
    price: {
        type: Number,
        required: true
    },
    offers: [{
        // Question: Can we change a pool's offer?
        ref: {
            type: Schema.ObjectId,
            ref: 'Offer',
            required: true
        },
        details: { // Copy offer details here for record keeping
            type: offerSchema,
            required: true
        },
        count: {
            type: Number,
            required: true,
            default: 1
        }
    }],
    coupon: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Coupon'
        },
        details: {
            type: couponSchema
        }
    },
    sale: {
        type: Schema.ObjectId,
        ref: 'Sale'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);