'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connection = require('../db/config');

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
        createdAt: now,
        updatedAt: now
    };
    connection.db.collection('users', (error, collection) => {
        collection.insert(admin, next);
    });
};

exports.down = function(next) {
    connection.db.collection('users', (error, collection) => {
        collection.remove({email: 'admin@thedipapp.com'}, next);
    });
};
