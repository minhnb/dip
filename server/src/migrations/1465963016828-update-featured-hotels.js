'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let p = hotels.map(hotel => {
                        hotel.featured = false;
                        if (hotel.name == 'Hotel Shangri-La') {
                            hotel.featured = true;
                        }
                        return collection.save(hotel)
                    });
                    Promise.all(p).then(() => {
                        next();
                    });
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let p = hotels.map(hotel => {
                        hotel.featured = undefined;
                        return collection.save(hotel)
                    });
                    Promise.all(p).then(() => {
                        next();
                    });
                }
            });
        });
    });
};
