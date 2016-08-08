'use strict';

const dotenv = require('dotenv');
const path = require('path');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');
const utils = require('../helpers/utils');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const offDay = '2016-08-12';

const up = async (function(next) {
    let update = {$push: {offDays: offDay}};
    return updateShangrilaOffers(update).then(function() {
        return next();
    }).catch(next);
});

const down = async (function(next) {
    let update = {$pull: {offDays: offDay}};
    return updateShangrilaOffers(update).then(function() {
        return next();
    }).catch(next);
});

exports = module.exports = {
    up: up,
    down: down
};

let getShangrilaHotel = async (function() {
    let query = {name: 'Hotel Shangri-La'},
        collection = await (getCollection('hotels'));
    return await (getOneDocument(collection, query));
});

let updateShangrilaOffers = async (function(update) {
    let shangrilaHotel = await (getShangrilaHotel());
    let poolId = shangrilaHotel.services[0];

    let offerCollection = await (getCollection('offers')),
        today = utils.convertDate(new Date().toDateString()),
        query = {
            hotel: shangrilaHotel._id,
            service: poolId,
            $or: [
                {dueDay: {$gte: today}},
                {dueDay: {$exists: false}}
            ]
        };

    return updateDocuments(offerCollection, query, update);
});

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