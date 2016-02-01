'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    pool: { type: Schema.ObjectId, ref: 'Pool' },
    baseId: Schema.ObjectId,
    date: Date,
    duration: {
        startTime: Number,
        endTime: Number
    },
    allotmentCount: Number,
    reservationCount: Number,
    tickets: [{
        ref_id: { type: Schema.ObjectId, ref: 'Ticket' },
        price: Number
    }],
    name: String,
    details: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);