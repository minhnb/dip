'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const specialOfferSchema = new Schema({
    hotels: [{
        ref: {
            type: Schema.ObjectId,
            ref: 'Hotel',
            required: true,
        },
        hosts: [{
            ref: {
                type: Schema.ObjectId,
                ref: 'HotelService',
                required: true
            },
            days: [{
                type: Number,
                enum: [0, 1, 2, 3, 4, 5, 6] // Monday is one...Sunday is 0
            }],
            startDay: String,
            endDay: String,
            duration: {
                startTime: {
                    type: Number,
                    required: true
                },
                endTime: {
                    type: Number,
                    required: true
                }
            },
            allotmentCount: {
                type: Number,
                required: true
            },
            reservationCount: {
                type: Schema.Types.Mixed,
                required: false
            }
        }]
    }],
    name: {
        type: String,
        required: true
    },
    description: String,
    instagram: String,
    email: String,
    url: String,
    image: {
        url: String,
        verified: Boolean
    },
    active: Boolean,
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('SpecialOffer', specialOfferSchema);