'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({'image.url': {$exists: false}, reservable: true}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    hotels.forEach(hotel => {
                    	hotel.reservable = false   
                    });
                    Promise.all(hotels.map(hotel => collection.save(hotel))).then(() => next());
                }
            });
        });
    });
};

exports.down = function(next) {
    next();
};
