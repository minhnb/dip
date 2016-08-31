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
    let collection = await (getCollection('offers')),
        query = {type: 'pass', passType: {$exists: false}};
    let offers = await (getDocuments(collection, query));

    let typeMapping = {
        poolservice: 'PoolPass',
        cabana: 'Cabana',
        daybed: 'Daybed'
    };
    let defaultType = 'PoolPass';
    let updatedCount = 0;

    Object.keys(typeMapping).forEach(key => {
        let _query = Object.assign({}, query);
        _query.amenities = key;
        let update = {passType: typeMapping[key]};
        let data = await (updateDocuments(collection, _query, {$set: update}));
        updatedCount += data.result.nModified;
    });
    // Apply default type for unmatched passes
    let update = {passType: defaultType};
    let data = await (updateDocuments(collection, query, {$set: update}));
    updatedCount += data.result.nModified;

    console.log(`updated ${updatedCount} offers`);

    return next();
});

const down = async (function(next) {
    let collection = await (getCollection('offers')),
        query = {type: 'pass', 'amenities.0': {$exists: true}, passType: {$exists: true}};
    let data = await (updateDocuments(collection, query, {$unset: {passType: 1}}));
    console.log('updated ' + data.result.nModified + ' offers');
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

let getDocuments = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.find(query).toArray((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

let getOneDocument = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.findOne(query, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

let updateDocuments = (collection, query, update) => {
    return new Promise((resolve, reject) => {
        collection.updateMany(query, update, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

let insertDocuments = (collection, documents) => {
    return new Promise((resolve, reject) => {
        collection.insert(documents, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

let removeDocuments = (collection, query, forced) => {
    return new Promise((resolve, reject) => {
        if (!forced && (!query || query == {})) {
            reject('Trying to remove whole collection without setting forced params');
        } else {
            collection.remove(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        }
    });
};