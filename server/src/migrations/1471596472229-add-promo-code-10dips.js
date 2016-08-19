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

const promos = [
    {
        code: '10dips',
        amount: 1000, // $10 = 1,000 cents
        type: 'DIP_CREDIT',
        taxType: 'AFTER_TAX',
        usageLimit: -1, // How many users can use this promo code at most?
        usageCount: 0,
        startDay: '2016-08-19',
        dueDay: '9999-01-01', // Hack: Use far away day as a replacement for no-due-day
        condition: {
            amenityTypes: [],
            events: [],
            hotelServices: [],
            hotels: [],
            offers: [],
            serviceTypes: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const up = async (function(next) {
    let collection = await (getCollection('promotions'));
    insertDocuments(collection, promos).then(() => {
        next();
    }, next);
});

const down = async (function(next) {
    let collection = await (getCollection('promotions'));
    let codes = promos.forEach(promo => promo.code),
        query = {code: {$in: codes}};
    removeDocuments(collection, query).then(() => {
        next();
    }, next);
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