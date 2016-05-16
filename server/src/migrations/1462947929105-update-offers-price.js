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
            collection.find({'ticket.price': {$exists: true}}).toArray((error, offers) => {
                if (error) {
                    next(error);
                } else {
                    let p = offers.map(offer => {
                        offer.price = offer.ticket.price;
                        if(offer.specialOffers) {
                        	offer.addons = offer.specialOffers;
                        }
                        return collection.save(offer);
                    });
                    return Promise.all(p).then(() => {
                    	collection.updateMany({ 
                    		'specialOffers': {$exists: true}
                    	}, {$unset: {'specialOffers' : '' }}, next)
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('offers', (error, collection) => {
            collection.find({'price': {$exists: true}}).toArray((error, offer) => {
                if (error) {
                    next(error);
                } else {
                    collection.updateMany({ 
                    	'price': {$exists: true}
                    }, {$unset: {'price' : '' }}, next)
                }
            });
        });
    });
};
