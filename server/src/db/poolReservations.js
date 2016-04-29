'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = require('./offers').schema;
const specialOfferSchema = require('./specialOffers').schema;
const Reservation = require('./reservations');

const poolReservationSchema = new Schema({
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
    }]
    //coupon: {
    //    ref: {
    //        type: Schema.ObjectId,
    //        ref: 'Coupon'
    //    },
    //    details: {
    //        type: couponSchema
    //    }
    //},
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var PoolReservations = Reservation.discriminator('Pool',
  poolReservationSchema);


module.exports = PoolReservations;