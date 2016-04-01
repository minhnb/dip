'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const membershipTypeSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    dipCredit: {
        type: Number,
        require: true
    },
    amount: {
        type: Number,
        require: true
    },
    planId: {
        type: String,
        require: true
    },
    //The frequency with which a subscription should be billed
    interval: {
        type: String,
        enum: ['day', 'week', 'month', 'year'],
        require: true
    },
    //The number of intervals between each subscription billing
    intervalCount: {
        type: Number,
        require: true,
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