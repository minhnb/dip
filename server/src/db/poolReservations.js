'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = require('./offers').schema;
const addonSchema = require('./addons').schema;
const Reservation = require('./reservations');

const poolReservationSchema = new Schema({
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
        addons: [{
            ref: {
                type: Schema.ObjectId,
                ref: 'Addon'
            },
            details: {
                type: addonSchema,
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