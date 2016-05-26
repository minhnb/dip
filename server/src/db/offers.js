'use strict';

const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const Schema = mongoose.Schema;

// Each offer needs to contain enough information so that we can filter for pools based on it
// Onto more details: filter based on date, start/end time, and price range

const offerSchema = new Schema({
    baseId: {
        type: Schema.ObjectId,
        ref: 'BaseOffer'
    },
    type: {
        type: String,
        ref: 'OfferType',
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        default: 1
    },
    description: {
        type: String,
        required: true,
        default: 'New Offer'
    },
    // pool: {
    //     type: Schema.ObjectId,
    //     ref: 'Pool',
    //     required: true
    // },
    service: {
        type: Schema.ObjectId,
        ref: 'HotelService',
        required: true
    },
    hotel: {
        type: Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    date: {
        type: String,
        required: true
    },
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
    reservationCount: {
        type: Number,
        required: true,
        default: 0
    },
    allotmentCount: {
        type: Number,
        required: true
    },
    amenities: [{
        type: String,
        ref: 'AmenityType'
    }],
    addons: [{
        type: Schema.ObjectId,
        ref: 'Addon'
    }],
    // TODO: Question: What will happen if the pool's owner delete that ticket/pass type?
    // Would all the offers using that ticket be deleted as well? What about base-offers?
    // ticket: {
    //     ref: {
    //         type: Schema.ObjectId,
    //         ref: 'Ticket'
    //     },
    //     price: {
    //         type: Number,
    //         required: true
    //     }
    // },
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
offerSchema.pre('save', function(next) {
    this.date = utils.convertDate(this.date);
    next();
});

const offerModel = mongoose.model('Offer', offerSchema);

module.exports = offerModel;
