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

const config = require('../config');
const connectionPromise = require('./db');

let shangrilaHotelCondition = {name: 'Hotel Shangri-La'};
let shangrilaEmails = {
    reservation: [{
        _id: mongoose.Types.ObjectId(),
        email: "armond@shangrila-hotel.com",
        name: 'Armond'
    }, {
        _id: mongoose.Types.ObjectId(),
        email: "sven@shangrila-hotel.com",
        name: 'Sven'
    }]
};
if (config.env != 'production' && config.env != 'prod') {
    shangrilaEmails = {
        reservation: [{
            _id: mongoose.Types.ObjectId(),
            email: 'vinh.dang@cofoundervp.com',
            name: 'Vinh Dang'
        }]
    };
}
let generalEmails = {
    reservation: []
};

const up = async (function(next) {
    let collection = await (getCollection('hotels'));

    await (updateDocuments(collection, {}, {$set: {emails: generalEmails}}));

    let hotel = await (getOneDocument(collection, shangrilaHotelCondition));
    return collection.update({_id: hotel._id}, {$set: {emails: shangrilaEmails}}, next);
});

const down = async (function(next) {
    let collection = await (getCollection('hotels'));
    return collection.update({}, {$unset: {emails: ''}}, next);
});

exports = module.exports = {
    up: up,
    down: down
};

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