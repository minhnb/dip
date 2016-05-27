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

exports.up = function(next) {
	connectionPromise.then(connection => {
	    connection.db.collection('hotels', (error, collection) => {
	        collection.find({'name': 'Hotel Shangri-La'}).toArray((error, hotels) => {
	            if (error) {
	                next(error);
	            } else {
	                let shangrilaHotel = hotels[0]._id,
	                	shangrilaPool = hotels[0].services[0];

	                let now = new Date();
	                let offers = [{
	                	type: 'specialOfferPass',
	                	description: 'Morning Pass',
	                	service: mongoose.Types.ObjectId(shangrilaPool),
	                	allotmentCount: 5,
	                	duration: {
	                		startTime: 480,
	                		endTime: 600
	                	},
	                	days: [1, 2, 3, 4, 5],
	                	amenities: ['cabana'],
	                	price: 1000
	                },
	                {
	                	type: 'specialOfferPass',
	                	description: 'Daytime Pass',
	                	service: mongoose.Types.ObjectId(shangrilaPool),
	                	allotmentCount: 10,
	                	duration: {
	                		startTime: 600,
	                		endTime: 1020
	                	},
	                	days: [1, 2, 3, 4, 5],
	                	amenities: ['cabana'],
	                	price: 1500
	                },
	                {
	                	type: 'specialOfferPass',
	                	description: 'Evening Pass',
	                	service: mongoose.Types.ObjectId(shangrilaPool),
	                	allotmentCount: 10,
	                	duration: {
	                		startTime: 1020,
	                		endTime: 1320
	                	},
	                	days: [1, 2, 3, 4, 5],
	                	amenities: ['cabana'],
	                	price: 1000
	                }];

	                offers.forEach(offer => {
	                    offer.createdAt = now;
	                    offer.updatedAt = now;
	                    offer.date = "2016-05-30";
	                    offer.hotel = shangrilaHotel;
	                    offer.reservationCount = 0;
	                });

	                return connectionPromise.then(connection => {
	                    return connection.db.collection('offers', (error, collection) => {
	                        collection.insert(offers, next);
	                    });
	                }).catch(next);
	            }   
	        });
	    });
	});
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        return connection.db.collection('offers', (error, collection) => {
            collection.remove({type: 'specialOfferPass'}, next);
        });
    });
};