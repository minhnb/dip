'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const amenitySchema = require('./subSchemas/amenity');
const submissionStatus = require('../constants/submissionStatus');
const utils = require('../helpers/utils');

const hotelSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    details: String,
    url: String,
    instagram: String,
    address: {
        airportCode: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        timezone: String,
        neighborhood: String
    },
    coordinates: {
        type: [Number],
        index: '2dsphere'
    },
    image: {
        url: String,
        verified: Boolean
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    phone: String,
    roomService: String,
    reservable: {
        type: Boolean,
        required: true,
        default: false
    },
    services: [{
        type: Schema.ObjectId,
        ref: 'HotelService'
    }],
    featured: {
        type: Boolean,
        required: true,
        default: false
    },
    dipLocation: String,
    emails: {
        reservation: [{
            email: {
                type: String,
                lowercase: true,
                required: true
            },
            name: String
        }]
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false
    },
    owner: {
        type: Schema.ObjectId,
        ref: 'User',
        required: false
    },
    pendingContent: {
        name: String,
        address: {
            airportCode: String,
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            timezone: String,
            neighborhood: String
        },
        coordinates: {
            type: [Number]
        },
        image: {
            url: String,
            verified: Boolean
        },
        dipLocation: String
    },
    submission: {
        status: {
            type: String,
            enum: utils.objectToArray(submissionStatus),
            default: submissionStatus.INITIAL,
            required: true
        },
        failReason: String
    },
    banned: {
        status: {
            type: Boolean,
            required: true,
            default: false
        },
        reason: String
    }
}, {
    timestamps: true
});
hotelSchema.index({name: 'text'});
hotelSchema.pre('find', function () {
    if (this._conditions && this._conditions.deleted == undefined) {
        this._conditions.deleted = false;
    }
});

hotelSchema.virtual('hasPendingContent').get(function() {
    let pendingContent = this.pendingContent.toObject(),
        hasPendingContent = false;
    Object.keys(pendingContent).forEach(key => {
        if (!utils.isEmptyObject(pendingContent[key])) {
            hasPendingContent = true;
        }
    });
    return hasPendingContent;
});

const hotelModel = mongoose.model('Hotel', hotelSchema);

module.exports = hotelModel;