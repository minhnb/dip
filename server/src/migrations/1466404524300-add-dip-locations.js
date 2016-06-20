'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    var listCities = require(__dirname + '/assets/dipLocations.json');
    return updateCities(listCities, next);
};

exports.down = function (next) {
    return updateCities([], next);
};

function updateCities(listLocations, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.remove({}, (error) => {
                if (error) {
                    next(error);
                } else {
                    if (listLocations.length == 0) {
                        Promise.resolve().then(() => next());
                    } else {
                        collection.insert(listLocations, (error) => {
                            Promise.resolve().then(() => next());
                        });
                    }
                }
            });
        });
    });
}