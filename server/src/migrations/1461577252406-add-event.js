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
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
            collection.find({'name': 'Shangrila Pool'}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let shangrilaPool = pools[0]._id;
                    let now = new Date();
                    let event = {
                        title: 'Launch Dip',
                        description: 'Come join us and celebrate the launch of  Dip in Los Angeles. We\’ve partnered with ModCloth and Dos Equis to start the Summer off right. First 50 guests receive ModCloth sponsored gift bags.',
                        instagram: 'thedipapp',
                        email: 'admin@thedipapp.com',
                        pool: mongoose.Types.ObjectId(shangrilaPool),
                        date: '2016-04-30',
                        duration : {
                            startTime : 360,
                            endTime : 600
                        },
                        capacity: 100,
                        reservationCount: 1,
                        price: 0,
                        partners: [{
                                name: 'Modcloth',
                                logo: {}
                            }

                        ],
                        active: true
                    }
                    event.createdAt = now;
                    event.updatedAt = now;

                    let imgPromises = event.partners.map(brand => {
                        let file_path = path.join(__dirname, `assets/events/${brand.name}.png`);
                        try {
                            let data = fs.readFileSync(file_path);
                            return s3.upload(`events/${brand.name}`, data, 'image/png');
                        } catch (err) {
                            return Promise.reject(err);
                        }
                    });
                    Promise.all(imgPromises).then(imgs => {
                        for (let i = 0; i < event.partners.length; i++) {
                            event.partners[i].logo = {
                                url: imgs[i].Location,
                                mediaType: 'image/png'
                            };
                        }

                        return connectionPromise.then(connection => {
                            connection.db.collection('events', (error, collection) => {
                                collection.insert(event, next);
                            });
                        });
                    }).catch(next);
                }   
            });
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('events', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
