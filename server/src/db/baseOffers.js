'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const baseOfferSchema = new Schema({
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
    reservationCount: Number,
    ticket: {
        type: Schema.ObjectId,
        ref: 'Ticket',
        required: true
    }
});

const baseOfferModel = mongoose.model('BaseOffer', baseOfferSchema);

module.exports = baseOfferModel;