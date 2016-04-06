'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

//sleep(1000);

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
        	if (error) {
                next(error);
            } else {
            	collection.updateMany({ 
            		active: {$exists: false}
            	}, {$set: {'active' : true }}, next)	
            }	          	
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
        	if(error) {
        		next(error);
        	} else {
        		collection.updateMany({ 
        			active: {$exists: true}
        		}, {$unset: {'active' : '' }}, next)	
        	}
        });
    });
};
