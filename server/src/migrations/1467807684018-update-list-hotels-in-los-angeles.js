'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let migrateDownPath = `assets/migration-down-1467807684018-update-list-hotels-in-los-angeles.json`;
let listHotelNames = [
    "Montage Beverly Hills",
    "SIXTY Beverly Hills",
    "The London West Hollywood",
    "The Peninsula Beverly Hills",
    "Sunset Marquis",
    "Hotel Shangri-La",
    "Ace Hotel Downtown LA",
    "The Standard Downtown LA",
    "The Standard Hollywood",
    "Sportsmen's Lodge Hotel",
    "Sunset Towers Hotel",
    "Custom Hotel",
    "Hollywood Roosevelt Hotel",
    "Hotel Wilshire"
];

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if (error) {
                next(error);
            } else {
                collection.find().toArray((error, hotels) => {
                    if (hotels.length > 0) {
                        let backupHotels = hotels.map(hotel => {
                            return {
                                name: hotel.name,
                                active: hotel.active,
                                reservable: hotel.reservable
                            };
                        });
                        let backup_data_file_path = path.join(__dirname, migrateDownPath);

                        saveJsonContentToFile(backup_data_file_path, backupHotels, (err) => {
                            if (err) {
                                return next(err);
                            }

                            let p = hotels.map(hotel => {
                                if (listHotelNames.indexOf(hotel.name) > -1) {
                                    hotel.active = true;
                                    hotel.reservable = true;
                                } else {
                                    hotel.active = false;
                                    hotel.reservable = false;
                                }
                                return collection.save(hotel);
                            });
                            Promise.all(p).then(() => {
                                next();
                            });
                        });
                    }
                });
            }
        });
    });
};

exports.down = function(next) {
    var hotelData = require(__dirname + '/' + migrateDownPath);
    let hotelNames = hotelData.map(hotel => hotel.name);
    var hotelMap = hotelData.reduce((obj, hotel) => {
        obj[hotel.name] = hotel;
        return obj;
    }, Object.create({}));
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if(error) {
                next(error);
            } else {
                collection.find({}).toArray((error, hotels) => {
                    if (hotels.length > 0) {
                        let p = hotels.map(hotel => {
                            if (hotelMap[hotel.name]) {
                                hotel.active = hotelMap[hotel.name].active;
                                hotel.reservable = hotelMap[hotel.name].reservable;
                                return collection.save(hotel);
                            } else {
                                return Promise.resolve();
                            }
                        });
                        Promise.all(p).then(() => {
                            next();
                        });
                    }
                });
            }
        });
    });
};

function saveJsonContentToFile(filePath, jsonContent, callback) {
    fs.access(filePath, fs.F_OK, function (err) {
        if (err) {
            fs.writeFile(filePath, JSON.stringify(jsonContent), 'utf8', function (error) {
                if (error) {
                    console.log("Back up data failed");
                    callback(error);
                } else  {
                    callback();
                }
            });
        } else {
            callback();
        }
    });
}