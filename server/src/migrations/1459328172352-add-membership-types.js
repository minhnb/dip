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
            name: 'Big',
            amount: 120,
            interval: 'month',
            intervalCount: 1,
            planId: 'big_plan'
        },
        {
            name: 'Little',
            amount: 90,
            interval: 'month',
            intervalCount: 1,
            planId: 'little_plan'
        },
        {
            name: 'Regular',
            amount: 60,
            interval: 'month',
            intervalCount: 1,
            planId: 'regular_plan'
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
