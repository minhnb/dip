'use strict';

// const imagemagick = require('imagemagick');

// Use imageMagick for jpg/png support
const gm = require('gm').subClass({'imageMagick': true});

const dipConstant = require('../constants/constants');

exports.resize = function(buffer, width, format) {
    format = format || 'jpg';
    return new Promise((resolve, reject) => {
        var pipe = gm(buffer).setFormat(format);
        pipe.size(function (err, size) {
            if (size && size.width) {
                if (!width) {
                    width = dipConstant.HOTEL_IMAGE_MAX_WIDTH;
                }
                if (size.width > width && size.height > dipConstant.HOTEL_IMAGE_HEIGHT) {
                    if (size.width > size.height) {
                        width = width * (size.width / size.height);
                    }
                    pipe = pipe.resize(width);
                }
            }
            pipe.toBuffer(function (err, buffer) {
                if (err) reject(err);
                else resolve(buffer);
            });
        });


        // imagemagick.resize({
        //     srcData: buffer,
        //     width: width,
        //     format: format
        //     // maxBuffer: 20*1024*1024
        // }, function (err, stdout, stderr) {
        //     if (err) reject(err);
        //     else {
        //         let data = new Buffer(stdout, 'binary');
        //         resolve(data);
        //     }
        // });
    });
};