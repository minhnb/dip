'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
            if (error) {
                next(error);
            } else {
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
                next();
            }
        });
    });
};
