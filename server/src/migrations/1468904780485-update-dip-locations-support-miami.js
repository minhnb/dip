'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let miamiId = "miami";
exports.up = function(next) {
    let supportMiami = true;
    return updateSupportedDipLocationForCity(miamiId, supportMiami, next);
};

exports.down = function(next) {
    let supportMiami = false;
    return updateSupportedDipLocationForCity(miamiId, supportMiami, next);
};

function updateSupportedDipLocationForCity(dipLocationId, supported, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('diplocations', (error, collection) => {
            collection.update({"_id": dipLocationId}, {$set: {supported: supported}}, (error, result) => {
                if (error) return next(error);
                if (result.result.n < 1) {
                    return next("Not Found Miami City");
                }
                return next();
            });
        });
    });
}