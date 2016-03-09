'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const wishListsSchema = new Schema({
    location: {
        city: String,
        state: String
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'pending', 'close']
    }
});

const WishListModel = mongoose.model('WishLists', wishListsSchema);

module.exports = WishListModel;