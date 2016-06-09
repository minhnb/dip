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
        connection.db.collection('hotelsubreservations', (error, collection) => {
        	let services = ['Pool', 'Spa', 'Restaurant']
        	let p = services.map(service => {
		    	collection.updateMany({ 
					'service.type': service
				}, {$set: {'service.type' : service + 'Service' }})
        	});
        	Promise.all(p).then(() => {
        		next();
        	})	
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelsubreservations', (error, collection) => {
        	let services = ['Pool', 'Spa', 'Restaurant']
        	let p = services.map(service => {
		    	collection.updateMany({ 
					'service.type': service + 'Service'
				}, {$set: {'service.type' : service}})
        	});
        	Promise.all(p).then(() => {
        		next();
        	})	
        });
    });
};
