'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = require('./offers').schema;
const specialOfferSchema = require('./specialOffers').schema;

const reservationSchema = new Schema({
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
    promotionDiscount: Number,
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
        },
        specialOffers: [{
            ref: {
                type: Schema.ObjectId,
                ref: 'SpecialOffers'
            },
            details: {
                type: specialOfferSchema,
                required: true
            },
            count: {
                type: Number,
                required: true,
                default: 1
            }
        }],
        members: [{
            type: Schema.ObjectId,
            ref: 'User'
        }]
    }],
    //coupon: {
    //    ref: {
    //        type: Schema.ObjectId,
    //        ref: 'Coupon'
    //    },
    //    details: {
    //        type: couponSchema
    //    }
    //},
    sale: {
        type: Schema.ObjectId,
        ref: 'Sale'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);