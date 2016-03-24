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
        connection.db.collection('users', (error, collection) => {
        	if (error) {
                next(error);
            } else {
            	collection.updateMany({ 
            		role: {$exists: false},
            		email: {$ne: 'admin@thedipapp.com'}
            	}, {$set: {'role' : 'user' }})
            	next();
            }
           	
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
        	if(error) {
        		next(error);
        	} else {
        		collection.updateMany({ 
        			role: {$exists: true},
        			email: {$ne: 'admin@thedipapp.com'}
        		}, {$set: {'role' : undefined }})
        		next();
        	}
        });
    });
};
