'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let lasVegas =  {
    "_id": "las_vegas",
    "name": "Las Vegas",
    "description": "Nevada",
    "supported": true
};
let lasVegasId = "las_vegas";
exports.up = function(next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.insert(lasVegas, (error) => {
                if (error) {
                    return next(error);
                }
                return next();
            });
        });
    });
};

exports.down = function(next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.remove({_id: lasVegas._id}, (error) => {
                if (error) {
                    return next(error);
                }
                return next();
            });
        });
    });
};