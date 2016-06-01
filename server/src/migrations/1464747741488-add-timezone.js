'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let p = hotels.map(hotel => {
                    	hotel.address.timezone = 'America/Los_Angeles';
                    	return collection.save(hotel);
                    });
                    return Promise.all(p).then(() => {
                    	next();
                    })
                }   
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if(error) {
                next(error);
            } else {
               	collection.updateMany({ 
               		'address.timezone': {$exists: true}
               	}, {$unset: {'address.timezone' : '' }}, next)	
            }
        });
    });
};
