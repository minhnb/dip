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
        connection.db.collection('hotelservices', (error, collection) => {
            collection.find({}).toArray((error, services) => {
                if (error) {
                    next(error);
                } else {
                	let reservableServices = [];
                    services.map(service => {
                    	if(service.amenities.length > 0) {
                    		reservableServices.push(service._id);
                    	}
                    });
                    connection.db.collection('hotels', (error, collection) => {
                        collection.find({services: {$in: reservableServices}}).toArray((error, hotels) => {
                            if (error) {
                                next(error);
                            } else {
                            	let p = hotels.map(hotel => {
                            		hotel.reservable = true;
                            		return collection.save(hotel)
                            	})
                            	Promise.all(p).then(() => {
                            		next();
                            	});
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
        connection.db.collection('hotels', (error, collection) => {
            if(error) {
                next(error);
            } else {
               	collection.updateMany({ 
               		'reservable': {$exists: true}
               	}, {$set: {'reservable' : false }}, next)	
            }
        });
    });
};
