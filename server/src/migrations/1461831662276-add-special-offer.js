'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose')
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
            collection.find({'name': 'Shangrila Pool'}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let shangrilaPool = pools[0]._id;
                    let now = new Date();
                    let offers = [{
                        name: 'Poolside Yoga',
                        price: 2000,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [1, 4],
                        	duration: {
                        		startTime: 480,
								endTime: 540
                        	},
                        	allotmentCount: 20,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }],
                        active: true
                    },
                    {
                        name: 'Sunday Brunch',
                        price: 4500,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [0],
                        	duration: {
                        		startTime: 600,
								endTime: 840
                        	},
                        	allotmentCount: 10,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }],
                        active: true
                    },
                    {
                        name: 'Massage Pass',
                        price: 6000,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [2],
                        	duration: {
                        		startTime: 720,
								endTime: 900
                        	},
                        	allotmentCount: 6,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }],
                        active: true
                    },
                    {
                        name: 'Manicure/Pedicure Pass',
                        price: 6000,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [4],
                        	duration: {
                        		startTime: 720,
								endTime: 900
                        	},
                        	allotmentCount: 6,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }]
                    },
                    {
                        name: 'Midweek Meetup',
                        price: 3000,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [3],
                        	duration: {
                        		startTime: 1080,
								endTime: 1200
                        	},
                        	allotmentCount: 20,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }]
                    },
                    {
                        name: 'Happy Hour',
                        price: 1000,
                        pools: [{
                        	ref: mongoose.Types.ObjectId(shangrilaPool),
                        	days: [1, 2, 3, 4, 5],
                        	duration: {
                        		startTime: 960,
								endTime: 1140
                        	},
                        	allotmentCount: 12,
                        	startDay: '2016-04-27',
                        	endDay: '2016-05-30'
                        }]
                        
                    }];
                    offers.forEach(offer => {
                        offer.createdAt = now;
                        offer.updatedAt = now;
                        offer.instagram = 'thedipapp',
                        offer.email = 'admin@thedipapp.com',
                        offer.image  = {
                            url : 'http://www.chinatravelkey.com/shanghai/shanghai-hotel-photo/pudong-shangri-la-hotel-shanghai/pudong-shangri-la-hotel-shanghai-pool-1b.jpg',
                            verified : true
                        };
                        offer.active = true,
                        offer.pools.forEach(pool => {
                        	pool.reservationCount = {}
                        })
                    });

                    return connectionPromise.then(connection => {
                        connection.db.collection('specialoffers', (error, collection) => {
                            collection.insert(offers, next);
                        });
                    });
                }   
            });
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('specialoffers', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
