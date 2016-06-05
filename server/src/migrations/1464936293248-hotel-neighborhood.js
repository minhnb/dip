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
    let file_path = path.join(__dirname, `assets/hotels_neighborhood.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var hotelData = JSON.parse(data);
        let hotelName = hotelData.map(hotel => hotel.name);
    	var hotelMap = hotelData.reduce((obj, hotel) => {
            obj[hotel.name] = hotel;
            return obj;
        }, Object.create({}));
        return connectionPromise.then(connection => {
	        connection.db.collection('hotels', (error, collection) => {
	            collection.find({'name': {$in: hotelName}}).toArray((error, hotels) => {
	                if (error) {
	                    next(error);
	                } else {
	                    hotels.map(hotel => {
	                    	hotel.address.neighborhood = hotelMap[hotel.name].neighborhood;
	                    	collection.save(hotel);
	                    });
	                    
	                    Promise.all(hotels.map(hotel => collection.save(hotel))).then(() => next());
	                }
	            });
	        });
	    });     	
    });
};

exports.down = function(next) {
    let file_path = path.join(__dirname, `assets/hotels_neighborhood.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var hotelData = JSON.parse(data);
        let hotelNames = hotelData.map(hotel => hotel.name);
    	return connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
        	collection.updateMany({'name': {$in: hotelNames}}, {$unset: {'address.neighborhood' : '' }}, next)	
        });
    });
       	
    });
};
