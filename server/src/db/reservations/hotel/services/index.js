'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelSubReservationSchema = new Schema({
    service: {
        ref: {
            type: Schema.ObjectId,
            ref: 'HotelService'
        },
        type: {
            type: String,
            enum: ['PoolService', 'SpaService', 'RestaurantService']
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
        count: {
            type: Number,
            required: true,
            default: 1
        },
        date: {
            type: String,
            required: true
        },
        addons: [{
            ref: {
                type: Schema.ObjectId,
                ref: 'Addon'
            },
            price: {
                type: Number,
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
        }],
        price: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});

const hotelSubReservationModel = mongoose.model('HotelSubReservation', hotelSubReservationSchema);

module.exports = hotelSubReservationModel;