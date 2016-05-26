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
        connection.db.collection('pools', (error, collection) => {
            collection.find({}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    pools.map(pool => {
                    	pool.type = 'Pool'
                    })
                    connection.db.collection('hotelservices', (error, collection) => {
                        collection.insert(pools, next);
                    });
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
