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
        connection.db.collection('pools', (error, collection) => {
            collection.find({'name': 'Hotel Shangri-La Santa Monica'}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let shangrilaPool = pools[0];
                    let now = new Date();
                    let hotel = {
                        name: 'Hotel Shangri-La',
                        details: '',
                        instagram: '@hotelshangrila',
                        image: shangrilaPool.image,
                        location: shangrilaPool.location,
                        address: shangrilaPool.address,
                        coordinates: shangrilaPool.coordinates,
                        phone: '3103942791',
                        roomService: 'x2015',
                        services: {
                        	pools: [{
                        		ref: mongoose.Types.ObjectId(shangrilaPool._id)
                        	}]
                        },
                        active: true,
                        reservable: true
                    }
                    hotel.createdAt = now;
                    hotel.updatedAt = now;

                    let file_path = path.join(__dirname, `assets/hotels/shangrila-hotel.png`);
                    let data = fs.readFileSync(file_path);
                    let p = s3.upload(`events/shangrila-hotel`, data, 'image/png');
                    return p.then(data => {
                        hotel.image = {
                            url: data.Location,
                            mediaType: 'image/png'
                        };
                        return connectionPromise.then(connection => {
                            connection.db.collection('hotels', (error, collection) => {
                                collection.insert(hotel, next);
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
            collection.remove({}, next);
        });
    });
};
