'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const promotionTypes = require('../constants/promotionType');
const promotionTaxTypes = require('../constants/promotionTaxType');
const utils = require('../helpers/utils');

const promotionSchema = new Schema({
    code: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    amount: {type: Number, required: true},
    type: {
        type: String,
        enum: utils.objectToArray(promotionTypes),
        require: true
    },
    taxType: {
        type: String,
        enum: utils.objectToArray(promotionTaxTypes),
    },
    usageLimit: Number,
    usageCount: {
        type: Number,
        require: true,
        default: 0
    },
    startDay: {
        type: String,
        required: true
    },
    dueDay: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Promotion', promotionSchema);