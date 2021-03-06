'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const msgSchema = new Schema({
    group: {
        type: Schema.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String
    },
    media: {
        url: String,
        contentType: String
    }
}, {
    timestamps: true
});
msgSchema.index({content: 'text'});


msgSchema.virtual('messageImageS3Path').get(function() {
    return 'messageImages/' + this._id;
});


module.exports = mongoose.model('Message', msgSchema);