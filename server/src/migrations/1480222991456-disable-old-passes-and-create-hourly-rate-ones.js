'use strict';

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const up = async (function(next) {
    let collection = await (getCollection('offers'));
    let todayString = '2016-11-27';
    let offerQuery = {
        deleted: false,
        price: {$exists: true},
        $or: [
            {
                dueDay: {$exists: false}
            },
            {
                dueDay: {$gt: todayString}
            }
        ]
    };
    let offers = await (getDocuments(collection, offerQuery));

    let newOffers = offers.map(offer => {
        let newOffer = Object.assign({}, offer);

        let now = new Date();
        newOffer._id = mongoose.Types.ObjectId();

        newOffer.reservationCount = {};
        newOffer.pendingReservationCount = {};
        newOffer.hourlyReservationCount = {};

        newOffer.startDay = todayString;
        newOffer.offDays = [];

        let totalPrice = newOffer.price,
            hours = (newOffer.duration.endTime - newOffer.duration.startTime) / 60;
        newOffer.hourlyPrice = Math.round(totalPrice / hours);
        delete newOffer.price;

        newOffer.createdAt = now;
        newOffer.updatedAt = now;

        return newOffer;
    });

    await (updateDocuments(collection, offerQuery, {
        $set: {
            dueDay: todayString
        }
    }));
    await (insertDocuments(collection, newOffers));

    return next();
});

const down = async (function(next) {
    let collection = await (getCollection('offers'));
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