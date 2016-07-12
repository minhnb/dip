'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let migrateDownPath = `assets/migration-down-1467801801585-update-hollywood-roosevelt-hotel.json`;
let hotelOldName = "Hollywood Roosevelt Hotel - A Thompson Hotel";
let hollywoodRooseveltHotel = {
    "name": "Hollywood Roosevelt Hotel",
    "amenities": [{"type": "Pool Pass"}]
};

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if (error) {
                next(error);
            } else {
                collection.find({"name": hotelOldName}).toArray((error, hotels) => {
                    if (hotels.length > 0) {
                        let hotel = hotels[0];
                        let backup_data_file_path = path.join(__dirname, migrateDownPath);

                        saveJsonContentToFile(backup_data_file_path, hotel, (err) => {
                            if (err) {
                                return next(err);
                            }
                            for (var key in hollywoodRooseveltHotel) {
                                hotel[key] = hollywoodRooseveltHotel[key];
                            }
                            return collection.save(hotel).then(() => next());
                        });
                    } else {
                        console.log("Not found hotel");
                        return next();
                    }
                });
            }
        });
    });
};

exports.down = function(next) {
    var hotelData = require(__dirname + '/' + migrateDownPath);
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if(error) {
                next(error);
            } else {
                collection.find({"name": hollywoodRooseveltHotel.name}).toArray((error, hotels) => {
                    if (hotels.length > 0) {
                        let hotel = hotels[0];
                        for (var key in hotelData) {
                            if (key != "_id") {
                                hotel[key] = hotelData[key];
                            }
                        }
                        return collection.save(hotel).then(() => next());
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