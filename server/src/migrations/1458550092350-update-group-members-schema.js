'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const mongoose = require('mongoose');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('groups', (error, collection) => {
            collection.find({'members.ref': {$exists: false}}).toArray((error, groups) => {
                if (error) {
                    next(error);
                } else {
                    groups.forEach(group => {
                        let count = group.members.length;
                        for (let i = 0; i < count; i++) {
                            let memberId = group.members[i];
                            group.members[i] = {
                                ref: memberId,
                                _id: new mongoose.Types.ObjectId() // unfortunate add-on of mongoose?
                            }
                        }
                        collection.save(group); // How to make sure that there's no error here?
                    });
                    next();
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('groups', (error, collection) => {
            collection.find({'members.ref': {$exists: true}}).toArray((error, groups) => {
                if (error) {
                    next(error);
                } else {
                    groups.forEach(group => {
                        let count = group.members.length;
                        for (let i = 0; i < count; i++) {
                            group.members[i] = group.members[i].ref;
                        }
                        collection.save(group); // How to make sure that there's no error here?
                    });
                    next();
                }
            });
        });
    });
};
