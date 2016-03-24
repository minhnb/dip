'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const membershipSchema = new Schema({
    type: {
        type: Schema.ObjectId,
        ref: 'MembershipType'
    },
    subscription: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = membershipSchema;