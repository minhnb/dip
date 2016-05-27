'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const mongoose = require('mongoose');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('offers', (error, collection) => {
            collection.find({}).toArray((error, offers) => {
                if (error) {
                    next(error);
                } else {
                    let p = offers.map(offer => {
                        offer.reservationCount = {};
                        offer.startDay = '2016-05-27',
                        offer.dueDay = '2016-06-27'
                        return collection.save(offer);
                    });
                    return Promise.all(p).then(() => {
                    	next();
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('offers', (error, collection) => {
            collection.find({}).toArray((error, offers) => {
                if (error) {
                    next(error);
                } else {
                    collection.updateMany({ 
                    	'reservationCount': {$exists: true}
                    }, {$unset: {'reservationCount' : '' }}, next)
                }
            });
        });
    });
};
