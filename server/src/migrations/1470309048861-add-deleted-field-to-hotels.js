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
    try {
        let collection = await(getCollection('hotels'));
        let updatedActiveHotels = await(updateDocuments(collection, {active: true, reservable: true}, {$set: {deleted: false}}));
        let updatedDeletedHotels = await(updateDocuments(collection, {deleted: {$exists: false}}, {$set: {deleted: true}}));
        console.log('updated active hotels: ' + updatedActiveHotels.result.nModified);
        console.log('updated deleted hotels ' + updatedDeletedHotels.result.nModified);
        return next();
    } catch (ex) {
        return next(ex);
    }

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
        collection.updateMany(query, update, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
});