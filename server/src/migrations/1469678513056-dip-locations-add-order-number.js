'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let dipLocationData = require(__dirname + '/assets/dipLocationsWithOrderNumber.json');

exports.up = function(next) {
    return updateDipLocations(dipLocationData).then((values) => next(), (reasons) => next(reasons));
};

exports.down = function (next) {
    return next();
};

function updateDipLocations(listLocations) {
    return new Promise((resolve, reject) => {
        connectionPromise.then(connection => {
            connection.db.collection('diplocations', (error, collection) => {
                if (error) {
                    return reject(error);
                }
                if (listLocations.length == 0) {
                    return resolve();
                }

                let listPromises = listLocations.map(dipLocation => {
                    let p = new Promise((resolve, reject) => {
                        collection.update({_id: dipLocation._id}, {$set: dipLocation}, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            resolve(result);
                        });
                    });
                    return p;
                });

                Promise.all(listPromises).then((values) => resolve(values), (reasons) => reject(reasons));
            });
        });
    });
}