'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const refsSchema = new Schema({
    owner: {
    	type: Schema.ObjectId,
    	ref: 'User',
        index: {unique: true},
        required: true
    },
    members: [{
        type: Schema.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

const RefsModel = mongoose.model('Refs', refsSchema);

module.exports = RefsModel;