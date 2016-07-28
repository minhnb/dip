'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let sanFrancisco = {
    "_id" : "san_francisco",
    "name" : "San Francisco",
    "description" : "California",
    "supported" : false
};

let bayArea = {
    "_id" : "san_francisco_bay_area",
    "name" : "Bay Area",
    "description" : "California",
    "supported" : false
};

exports.up = function(next) {
    return changeDipLocation(sanFrancisco, bayArea).then((value) => next(), (reason) => next(reason));
};

exports.down = function (next) {
    return changeDipLocation(bayArea, sanFrancisco).then((value) => next(), (reason) => next(reason));
};

function changeDipLocation(remove, insert, next) {
    return new Promise((resolve, reject) => {
        connectionPromise.then(connection => {
            connection.db.collection('diplocations', (error, collection) => {
                collection.remove(remove, (error) => {
                    if (error) {
                        return reject(error);
                    } else {
                        collection.insert(insert, (error) => {
                            if (error) {
                                return reject(error);
                            }
                            resolve();
                        });
                    }
                });
            });
        });
    });
}