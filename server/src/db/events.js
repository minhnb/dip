'use strict';

const mongoose = require('mongoose');
const utils = require('../helpers/utils');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        url: String,
        verified: Boolean
    },
    partners: [{
        name: String,
        logo: {
            url: {
                type: String,
                required: true
            },
            mediaType: {
                type: String,
                required: true
            }
        }
    }],
    members: [{
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    }],
    capacity: {
        type: Number,
        required: true,
        default: 1
    },
    reservationCount: {
        type: Number,
        required: true,
        default: 0
    },
    instagram: String,
    url: String,
    email: String,
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
    price: {
        type: Number,
        default: 0,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
eventSchema.pre('save', function(next) {
    this.date = utils.convertDate(this.date);
    next();
});

module.exports = mongoose.model('Event', eventSchema);



