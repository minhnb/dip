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
    let now = new Date();
    let admin = {
        firstName: 'Dip',
        gender: 'na',
        email: 'admin@thedipapp.com',
        account: {
            balance: 0
        },
        privateMode: false,
        role: 'admin',
        createdAt: now,
        updatedAt: now
    };
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
            collection.insert(admin, next);
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
            collection.remove({email: 'admin@thedipapp.com'}, next);
        });
    });
};
