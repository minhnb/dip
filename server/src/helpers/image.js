'use strict';

const imagemagick = require('imagemagick');

exports.resize = function(buffer, width, format) {
    format = format || 'jpg';
    return new Promise((resolve, reject) => {
        imagemagick.resize({
            srcData: buffer,
            width: width,
            format: format
        }, function (err, stdout, stderr) {
            if (err) reject(err);
            else {
                let data = new Buffer(stdout, 'binary');
                resolve(data);
            }
        });
    });
};