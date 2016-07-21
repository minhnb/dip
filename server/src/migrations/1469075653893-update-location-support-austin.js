'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let dipLocationId = "austin";
exports.up = function(next) {
    let supportAustin = true;
    let austin = {city: "Travis County", state: "Texas"};
    return addSupportCity(austin).then(() => {
        return updateSupportedDipLocationForCity(dipLocationId, supportAustin, next);
    });
};

exports.down = function(next) {
    let supportAustin = false;
    return updateSupportedDipLocationForCity(dipLocationId, supportAustin, next);
};

function updateSupportedDipLocationForCity(dipLocationId, supported, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.update({"_id": dipLocationId}, {$set: {supported: supported}}, (error, result) => {
                if (error) return next(error);
                if (result.result.n < 1) {
                    return next("Not Found Austin City");
                }
                return next();
            });
        });
    });
}

function addSupportCity(city) {
    return new Promise((resolve, reject) => {
        connectionPromise.then(connection => {
            connection.db.collection('cities', (error, collection) => {
                collection.find(city).toArray((error, cities) => {
                    if (cities.length > 0) {
                        return resolve();
                    }
                    collection.insert(city, (error, results) => {
                        if (error) {
                            console.log(error);
                        }
                        resolve();
                    });
                });
            });
        });
    });
}