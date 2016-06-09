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
        connection.db.collection('reservations', (error, collection) => {
        	let reservations = ['Hotel', 'SpecialOffer', 'Event'];
        	let p = reservations.map(reservation => {
		    	collection.updateMany({ 
					type: reservation
				}, {$set: {type : reservation + 'Reservation' }})
        	});
        	Promise.all(p).then(() => {
        		next();
        	})	
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
        	let reservations = ['Hotel', 'SpecialOffer', 'Event'];
        	let p = reservations.map(reservation => {
		    	collection.updateMany({ 
					type: reservation + 'Reservation'
				}, {$set: {type : reservation}})
        	});
        	Promise.all(p).then(() => {
        		next();
        	})
        });
    });
};
