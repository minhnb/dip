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
        connection.db.collection('users', (error, userCollection) => {
            if (error) {
                next(error);
            } else {
                userCollection.findOne({email: process.env.ADMIN_EMAIL}, (error, admin) => {
                    if (error) {
                        next(error);
                    } else {
                        connection.db.collection('groups', (error, collection) => {
                            if (error) {
                                next(error);
                            } else {
                                collection.updateMany(
                                    {owner: admin._id},
                                    {$set: {name: 'Support'}},
                                    next
                                );
                            }
                        });
                    }
                });
            }
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, userCollection) => {
            if (error) {
                next(error);
            } else {
                userCollection.findOne({email: process.env.ADMIN_EMAIL}, (error, admin) => {
                    if (error) {
                        next(error);
                    } else {
                        connection.db.collection('groups', (error, collection) => {
                            if (error) {
                                next(error);
                            } else {
                                collection.updateMany(
                                    {owner: admin._id},
                                    {$set: {name: 'Dip'}},
                                    next
                                );
                            }
                        });
                    }
                });
            }
        });
    });
};
