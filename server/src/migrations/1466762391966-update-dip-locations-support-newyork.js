'use strict';

const connectionPromise = require('./db');

let newYorkId = "new_york";
exports.up = function(next) {
    let supportNY = true;
    return updateSupportedDipLocationForCity(newYorkId, supportNY, next);
};

exports.down = function(next) {
    let supportNY = false;
    return updateSupportedDipLocationForCity(newYorkId, supportNY, next);
};

function updateSupportedDipLocationForCity(dipLocationId, supported, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.update({"_id": dipLocationId}, {$set: {supported: supported}}, (error, result) => {
                if (error) return next(error);
                if (result.result.n < 1) {
                    return next("Not Found New York City");
                }
                return next();
            });
        });
    });
}