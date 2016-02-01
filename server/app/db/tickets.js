'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    pool: { type: Schema.ObjectId, ref: 'Pool' },
    code: String,
    name: String,
    restrictionText: String,
    price: Number
});

module.exports = mongoose.model('Ticket', ticketSchema);