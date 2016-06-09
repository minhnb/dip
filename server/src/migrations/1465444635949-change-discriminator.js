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
        connection.db.collection('hotelservices', (error, collection) => {
        	collection.updateMany({ 
    			type: 'Pool'
    		}, {$set: {type : 'PoolService' }}, next)	
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
        	collection.updateMany({ 
    			type: 'PoolService'
    		}, {$set: {type : 'Pool' }}, next)	
        });
    });
};
