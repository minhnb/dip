'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    pool: {
        type: Schema.ObjectId,
        ref: 'Pool',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        validate: {
            validator: function(r) {
                return r >= 0 && r <= 5;
            },
            message: 'Rating must be between 0 and 5'
        }
    }
}, {
    timestamps: true
});
ratingSchema.index({user: 1, pool: 1}, {unique: true});

module.exports = mongoose.model('Rating', ratingSchema);