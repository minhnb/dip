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
    let file_path = path.join(__dirname, `assets/pool_amenities.json`);
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
	        connection.db.collection('pools', (error, collection) => {
	            collection.find({'name': {$in: poolNames}}).toArray((error, pools) => {
	                if (error) {
	                    next(error);
	                } else {
	                    pools.map(pool => {
	                    	pool.amenities = [];
	                    	if (poolMap[pool.name].daybed != '') {
	                    	    pool.amenities.push({
	                    	        type: 'daybed',
	                    	        count: poolMap[pool.name].daybed,
	                    	        details: poolMap[pool.name].daybedPrice
	                    	    });
	                    	}
	                    	if (poolMap[pool.name].cabana != '') {
	                    	    pool.amenities.push({
	                    	        type: 'cabana',
	                    	        count: poolMap[pool.name].cabana,
	                    	        details: poolMap[pool.name].cabanaPrice
	                    	    });
	                    	}
	                    	collection.save(pool);
	                    })
	                    next();
	                }
	            });
	        });
	    });
       	
    });
};

exports.down = function(next) {
    let file_path = path.join(__dirname, `assets/pool_amenities.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var poolData = JSON.parse(data);
        let poolNames = poolData.map(pool => pool.name);
    	return connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
            collection.find({'name': {$in: poolNames}}).toArray((error, pools) => {
            	pools.map(pool => {
            		pool.amenities = [];
            		collection.save(pool);
            	})
            	next();
            })
        });
    });
       	
    });
};
