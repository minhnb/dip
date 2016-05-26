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
                    connection.db.collection('specialoffers', (error, collection) => {
                        collection.find({}).toArray((error, offers) => {
                            if (error) {
                                next(error);
                            } else {
                                let p =offers.map(offer => {
                                    let hotels = [];
                                    hotels.push({
                                        ref: mongoose.Types.ObjectId(shangrilaHotel._id),
                                        hosts: offer.pools
                                    })
                                    offer.hotels = hotels;
                                    delete offer.pools;
                                    delete offer.hotel;
                                    collection.save(offer);
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
        connection.db.collection('specialoffers', (error, collection) => {
            collection.find({}).toArray((error, offers) => {
                if (error) {
                    next(error);
                } else {
                    let p = offers.map(offer => {
                        offer.pools = offer.hotels[0].hosts;
                        delete offer.hosts;
                        collection.save(offer);
                    });
                    Promise.all(p).then(() => {
                        next();
                    })
                }   
            });
        });
    });
};
