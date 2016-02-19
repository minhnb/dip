'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ratingSchema = new Schema({
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
            validator: function validator(r) {
                return r >= 0 && r <= 5;
            },
            message: 'Rating must be between 0 and 5'
        }
    }
});
ratingSchema.index(['user', 'pool'], { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);