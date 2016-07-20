'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const getCollection = async (collectionName => {
    let connection = await (connectionPromise);
    return connection.db.collection(collectionName);
});

let offerPath = path.join(__dirname, 'assets/1469019327155-add-shangrila-passes.json');
let migrateDownPath = path.join(__dirname, 'assets/migrate-down-1469019327155-add-shangrila-passes.json');

const up = async (function(next) {
    let shangrilaHotel = await (getShangrilaHotel());
    let poolId = shangrilaHotel.services[0],
        now = new Date();

    let offers = require(offerPath),
        offerCollection = await (getCollection('offers'));

    offers = offers.map(offer => {
        let _offer = {
            _id: mongoose.Types.ObjectId(),
            type: offer.type,
            description: offer.description,
            days: offer.days,
            duration: {
                // The duration is stored as "hours" in json file,
                // so we need to multiply those by 60 here
                startTime: offer.startTime * 60,
                endTime: offer.endTime * 60
            },
            capacity: offer.capacity,
            price: offer.price,
            allotmentCount: offer.allotmentCount,
            service: poolId,
            hotel: shangrilaHotel._id,
            startDay: offer.startDay,
            dueDay: offer.dueDay,
            amenities: [],
            addons: [],
            createdAt: now,
            updatedAt: now
        };
        if (!_offer.dueDay) delete(_offer.dueDay);
        return _offer;
    });

    return offerCollection.insert(offers, err => {
        if (err) {
            next(err);
        } else {
            fs.writeFile(migrateDownPath, JSON.stringify(offers), 'utf8', next);
        }
    });
});

const down = async (function(next) {
    let shangrilaHotel = await (getShangrilaHotel());
    let poolId = shangrilaHotel.services[0];

    let offers = require(migrateDownPath),
        offerCollection = await (getCollection('offers'));

    let offerIds = offers.map(offer => {
        return mongoose.Types.ObjectId(offer._id);
    });

    return offerCollection.update({
        _id: {$in: offerIds},
        service: poolId
    }, {
        $set: {dueDate: '2016-07-20'}
    }, next);
});

let getShangrilaHotel = async (function() {
    let collection = await (getCollection('hotels'));
    return new Promise((resolve, reject) => {
        collection.findOne({name: 'Hotel Shangri-La'}, (err, hotel) => {
            if (err) {
                reject(err);
            } else {
                resolve(hotel);
            }
        });
    });
});

exports = module.exports = {
    up: up,
    down: down
};