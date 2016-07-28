'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const membershipTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    dipCredit: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    planId: {
        type: String,
        required: true
    },
    //The frequency with which a subscription should be billed
    interval: {
        type: String,
        enum: ['day', 'week', 'month', 'year'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    //The number of intervals between each subscription billing
    intervalCount: {
        type: Number,
        required: true,
        default: 1
    },
    icon: {
        url: {
            type: String
            // required: true
        },
        mediaType: {
            type: String
            // required: true
        }
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('MembershipType', membershipTypeSchema);