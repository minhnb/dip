'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    let startDay = '2016-07-24';
    let startDayCondition = '2016-07-20';
    return updateStartDayForPassesOfShangriLaHotel(startDay, startDayCondition, next);
};

exports.down = function(next) {
    let startDay = '2016-07-20';
    let startDayCondition = '2016-07-24';
    return updateStartDayForPassesOfShangriLaHotel(startDay, startDayCondition, next);
};

function updateStartDayForPassesOfShangriLaHotel(startDay, startDayCondition, next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({name: "Hotel Shangri-La"}).toArray((error, hotels) => {
                if (error) {
                    return next(error);
                }
                if (hotels.length == 0) {
                    return next("Not found hotel");
                }
                let hotel = hotels[0];

                connection.db.collection('offers', (error, collection) => {
                    collection.find({hotel: hotel._id, type: "pass", startDay: startDayCondition}).toArray((error, offers) => {
                        let listPromises = [];
                        offers.map(offer => {
                            if (offer.days.indexOf(6) > -1) {
                                let p = new Promise((resolve, reject) => {
                                    offer.startDay = startDay;
                                    collection.save(offer, (error, result) => {
                                        if (error) {
                                            console.log(error);
                                        }
                                        resolve();
                                    });
                                });
                                listPromises.push(p);
                            }
                        });
                        Promise.all(listPromises).then(() => next());
                    });
                });
            });
        });
    });
}