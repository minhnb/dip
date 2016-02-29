'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var msgSchema = new Schema({
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

msgSchema.virtual('messageImageS3Path').get(function () {
    return 'messageImage/' + this._id;
});

module.exports = mongoose.model('Message', msgSchema);