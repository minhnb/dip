'use strict';

const dotenv = require('dotenv');
const path = require('path');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const up = async (function(next) {
    let hotelCollection = await (getCollection('hotels'));
    let hotel = await (getOneDocument(hotelCollection, {name: 'Hotel Shangri-La'}));

    let collection = await (getCollection('offers'));
    await (updateDocuments(collection, {
        hotel: hotel._id,
        description: 'Cabana',
        amenities: {$size: 0}
    }, {
        $set: {
            amenities: ['cabana']
        }
    }));

    await (updateDocuments(collection, {
        hotel: hotel._id,
        description: 'Daybed',
        amenities: {$size: 0}
    }, {
        $set: {
            amenities: ['daybed']
        }
    }));

    return next();
});

const down = async (function(next) {
    return next();
});

exports = module.exports = {
    up: up,
    down: down
};

///////////// Helper functions /////////////
let getCollection = async (collectionName => {
    let connection = await (connectionPromise);
    return connection.db.collection(collectionName);
});

let getDocuments = async ((collection, query) => {
    return new Promise((resolve, reject) => {
        collection.find(query).toArray((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
});

let getOneDocument = async ((collection, query) => {
    return new Promise((resolve, reject) => {
        collection.findOne(query, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
});

let updateDocuments = async ((collection, query, update) => {
    return new Promise((resolve, reject) => {
        collection.update(query, update, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
});