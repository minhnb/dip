'use strict';

var mongoose = require('mongoose');
var utils = require('../helpers/utils');

var Schema = mongoose.Schema;

// Each offer needs to contain enough information so that we can filter for pools based on it
// Onto more details: filter based on date, start/end time, and price range

var offerSchema = new Schema({
    baseId: {
        type: Schema.ObjectId,
        ref: 'BaseOffer'
    },
    description: {
        type: String,
        required: true,
        default: 'New Offer'
    },
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
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
        type: Schema.ObjectId,
        ref: 'Amenity'
    }],
    // TODO: Question: What will happen if the pool's owner delete that ticket/pass type?
    // Would all the offers using that ticket be deleted as well? What about base-offers?
    ticket: {
        ref: {
            type: Schema.ObjectId,
            ref: 'Ticket'
        },
        price: {
            type: Number,
            required: true
        }
    }
}, {
    timestamps: true
});
offerSchema.pre('save', function (next) {
    this.date = utils.convertDate(this.date);
    next();
});

var offerModel = mongoose.model('Offer', offerSchema);

module.exports = offerModel;