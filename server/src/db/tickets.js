'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true,
        default: ''
    }
});

const ticketModel = mongoose.model('Ticket', ticketSchema);

module.exports = ticketModel;