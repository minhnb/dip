'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const availabilitySchema = new Schema({
    pool: { type: Schema.ObjectId, ref: 'Pool' },
    availabilityType: Number,
    reservationCount: Number,
    allotmentCount: Number,
    date: Date,
    duration: {
        startTimeMinutes: { type: Number, required: true },
        endTimeMinutes: { type: Number, required: true }
    },
    name: String,
    parentAvailability: { type: Schema.ObjectId, ref: 'Availability' },
    offers: [{ type: Schema.ObjectId, ref: 'Offer' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Availability', availabilitySchema);