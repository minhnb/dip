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
            collection.find({'name': 'Hotel Shangri-La'}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let shangrilaHotel = pools[0];
                    let shangrilaPool = shangrilaHotel.services[0].ref;
                    connection.db.collection('events', (error, collection) => {
                        collection.find({}).toArray((error, events) => {
                            if (error) {
                                next(error);
                            } else {
                                let p = events.map(event => {
                                	event.hotel = mongoose.Types.ObjectId(shangrilaHotel._id);
                                	event.host = mongoose.Types.ObjectId(shangrilaPool);
                                	delete event.pool;
                                	collection.save(event);
                                });
                                Promise.all(p).then(() => {
                                    next();
                                })
                            }   
                        });
                    });
                }   
            });
        });
    });  
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('events', (error, collection) => {
            collection.find({}).toArray((error, events) => {
                if (error) {
                    next(error);
                } else {
                    let p = events.map(event => {
                    	event.pool = mongoose.Types.ObjectId(event.host._id);
                    	delete event.hotel;
                    	delete event.host;
                    	collection.save(event);
                    });
                    Promise.all(p).then(() => {
                        next();
                    })
                }   
            });
        });
    });
};
