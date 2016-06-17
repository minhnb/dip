'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    var listCities = require(__dirname + '/assets/cities.json');
    return updateCities(listCities, next);
};

exports.down = function (next) {
    let losAngeles = {
        "city": "Los Angeles",
        "state": "California"
    };
    return updateCities(losAngeles, next);
};

function updateCities(listCities, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('cities', (error, collection) => {
            collection.remove({}, (error) => {
                if (error) {
                    next(error);
                } else {
                    collection.insert(listCities, (error) => {
                        Promise.resolve().then(() => next());
                    });
                }
            });
        });
    });
}