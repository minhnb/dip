'use strict';

// const imagemagick = require('imagemagick');

// Use imageMagick for jpg/png support
const gm = require('gm').subClass({'imageMagick': true});

exports.resize = function(buffer, width, format) {
    format = format || 'jpg';
    return new Promise((resolve, reject) => {
        var pipe = gm(buffer).setFormat(format);
        if (width) {
            pipe = pipe.resize(width);
        }
        pipe.toBuffer(function (err, buffer) {
            if (err) reject(err);
            else resolve(buffer);
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