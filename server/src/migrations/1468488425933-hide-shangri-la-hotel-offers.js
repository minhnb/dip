'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    let dueDay = '2016-07-13';
    let dueDayCondition = {$gt: dueDay};
    return updateDueDayForPassesOfShangriLaHotel(dueDay, dueDayCondition, next);
};

exports.down = function(next) {
    let dueDay = '2017-06-22';
    let dueDayCondition = '2016-07-13';
    return updateDueDayForPassesOfShangriLaHotel(dueDay, dueDayCondition, next);
};

function updateDueDayForPassesOfShangriLaHotel(dueDay, dueDayCondition, next) {
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
                    collection.find({hotel: hotel._id, type: "pass", dueDay: dueDayCondition}).toArray((error, offers) => {
                        let p = offers.map(offer => {
                            offer.dueDay = dueDay;
                            return collection.save(offer);
                        });
                        Promise.all(p).then(() => next());
                    });
                });
            });
        });
    });
}