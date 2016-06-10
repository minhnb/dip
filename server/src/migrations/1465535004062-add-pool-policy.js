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
    let file_path = path.join(__dirname, `assets/pool-policy.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var poolData = JSON.parse(data);
        let poolNames = poolData.map(pool => pool.name);
    	var poolMap = poolData.reduce((obj, pool) => {
            obj[pool.name] = pool;
            return obj;
        }, Object.create({}));
        return connectionPromise.then(connection => {
	        connection.db.collection('hotelservices', (error, collection) => {
	            collection.find({'name': {$in: poolNames}}).toArray((error, pools) => {
	                if (error) {
	                    next(error);
	                } else {
	                    pools.map(pool => {
	                    	pool.policy = poolMap[pool.name].policy;
	                    })
	                    Promise.all(pools.map(pool => collection.save(pool))).then(() => next());
	                }
	            });
	        });
	    });
       	
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
    		collection.updateMany({ 
	        	'policy': {$exists: true}
	        }, {$unset: {'policy' : '' }}, next)
        });
    });
};
