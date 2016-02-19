'use strict';

var userRef = require('./userRef');

function convertPhoto(photo) {
    return {
        id: photo._id,
        user: userRef(photo.user),
        caption: photo.caption,
        url: photo.assert.url,
        date: photo.createdAt
    };
}

module.exports = convertPhoto;