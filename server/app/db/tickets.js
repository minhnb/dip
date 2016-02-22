'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ticketSchema = new Schema({
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
}, {
    timestamps: true
});

var ticketModel = mongoose.model('Ticket', ticketSchema);

module.exports = ticketModel;