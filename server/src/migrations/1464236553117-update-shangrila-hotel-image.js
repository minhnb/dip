'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose')
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({'name': 'Hotel Shangri-La'}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let shangrilahotel = hotels[0];
                    let now = new Date();
                    
                    shangrilahotel.updatedAt = now;
                    let tmpName = shangrilahotel.name.replace(/ /g, "_").toLowerCase();
                    let file_path = path.join(__dirname, `assets/hotels/${tmpName}.png`);
                    let data = fs.readFileSync(file_path);
                    let p = s3.upload(`hotels/${tmpName}`, data, 'image/png');
                    return p.then(data => {
                        shangrilahotel.image = {
                            url: data.Location,
                            mediaType: 'image/png'
                        };
                        return connectionPromise.then(connection => {
                            connection.db.collection('hotels', (error, collection) => {
                                collection.save(shangrilahotel, next);
                            });
                        });
                    })
                }   
            });
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.remove({'name': 'Hotel Shangri-La'}, next);
        });
    });
};
