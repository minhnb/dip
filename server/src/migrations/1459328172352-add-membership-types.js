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
const stripe = require('../helpers/stripe');

exports.up = function(next) {
    let now = new Date();
    let types = [
        {
            name: 'Litte Dipper',
            amount: 300,
            interval: 'month',
            intervalCount: 1,
            description: '$45 Dip Credit'
            planId: 'little_dipper'
        },
        {
            name: 'Big Dipper',
            amount: 600,
            interval: 'month',
            intervalCount: 1,
            description: '$100 Dip Credit'
            planId: 'big_dipper'
        },
        {
            name: 'Dip Regular',
            amount: 1250,
            interval: 'month',
            intervalCount: 1,
            description: '$250 Dip Credit'
            planId: 'dip_regular'
        }
    ];
    types.forEach(amenity => {
        amenity.createdAt = now;
        amenity.updatedAt = now;
    });

    let membershipPromise = types.map(type => {
    	let plan = {
    	    amount: type.amount,
    	    interval: type.interval,
    	    name: type.name,
    	    currency: 'usd',
    	    id: type.planId
    	};
    	try {
    	    return stripe.createPlan(plan).then(() => { 
    	    	let file_path = path.join(__dirname, `assets/membership/${type.planId}.png`);
    	    	try {
    	    	    let data = fs.readFileSync(file_path);
    	    	    return s3.upload(`membership/${type.planId}`, data, 'image/png');
    	    	} catch (err) {
    	    	    return Promise.reject(err);
    	    	}
    	    })
    	} catch (err) {
    	    return Promise.reject(err);
    	}

    	
    })
    Promise.all(membershipPromise).then(imgs => {
        for (let i = 0; i < types.length; i++) {
            types[i].icon = {
                url: imgs[i].Location,
                mediaType: 'image/png'
            };
        }

        return connectionPromise.then(connection => {
            connection.db.collection('membershiptypes', (error, collection) => {
                collection.insert(types, next);
            });
        });
    }).catch(next);
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('membershiptypes', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
