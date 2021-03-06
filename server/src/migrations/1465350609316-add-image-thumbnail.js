'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const request = require('request-promise');
const im = require('imagemagick');
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({'image.url': {$exists: true}}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let imgPromises = hotels.map(hotel => {
                    	let tmpName = hotel.name.replace(/ /g, "_").toLowerCase();
                    	return request({
                    		'url': hotel.image.url,
            		        'encoding':'binary'
                    	}).then(result => {
                    		im.resize({
                    		  srcData: result,
                    		  width: 736
                    		}, function(err, stdout, stderr){
                    		  let data = new Buffer(stdout, 'binary');
                    		  return s3.upload(`hotels/${tmpName}_resized`, data, 'image/jpg').then(img => {
                                console.log(img.Location)
                              })
                    		});
                    	});
                    });
                    Promise.all(imgPromises).then(imgs => {
                        return next();
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    next()
};
