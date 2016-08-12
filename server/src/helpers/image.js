'use strict';

const imagemagick = require('imagemagick');

exports.resize = function(buffer, width, format) {
    format = format || 'jpg';
    return new Promise((resolve, reject) => {
        imagemagick.resize({
            srcData: buffer,
            width: width,
            format: format
            // maxBuffer: 20*1024*1024
        }, function (err, stdout, stderr) {
            if (err) reject(err);
            else {
                let data = new Buffer(stdout, 'binary');
                resolve(data);
            }
        });
    });
};