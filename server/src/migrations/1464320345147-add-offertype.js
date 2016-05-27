'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    let now = new Date();
    let offer = {
        _id: 'specialOfferPass',
        name: 'Special Offer Pass',
        createdAt: now,
        updatedAt: now
    };
    let file_path = path.join(__dirname, `assets/offer-${offer._id}.png`);
    let data = fs.readFileSync(file_path);
    return s3.upload(`offer/${offer._id}`, data, 'image/png').then(img => {
    	offer.icon = {
            url: img.Location,
            mediaType: 'image/png'
        };
        return connectionPromise.then(connection => {
            return connection.db.collection('offertypes', (error, collection) => {
                collection.insert(offer, next);
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        return connection.db.collection('offertypes', (error, collection) => {
            collection.remove({_id: 'specialOfferPass'}, next);
        });
    });
};
