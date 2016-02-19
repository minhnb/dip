'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var baseOfferSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
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
    allotmentCount: Number,
    amenities: [{
        type: Schema.ObjectId,
        ref: 'Amenities'
    }],
    ticket: {
        type: Schema.ObjectId,
        ref: 'Ticket',
        required: true
    }
});

var baseOfferModel = mongoose.model('BaseOffer', baseOfferSchema);

module.exports = baseOfferModel;