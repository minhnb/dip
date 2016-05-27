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
                    let shangrilaHotel = hotels[0],
                        shangrilaPool = hotels[0].services[0];
                    connection.db.collection('specialoffers', (error, collection) => {
                        collection.find({}).toArray((error, offers) => {
                            if (error) {
                                next(error);
                            } else {
                                let p = offers.map(offer => {
                                    let hotels = [];
                                    hotels.push({
                                    	ref: offer.hotels[0].ref,
                                    	hosts: offer.hotels[0].hosts.map(host => shangrilaPool)
                                    })
                                    offer.hotels = hotels;
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
            collection.remove({}, next);
        });
    });
};
