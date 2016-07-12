'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let migrateDownPath = path.join(__dirname, `assets/migration-down-1468291291558-update-los-angeles-hotels-non-featured.json`);
let dipLocation = "los_angeles";
let LosAngelesDataFilePath = path.join(__dirname, `assets/hotel_los_angeles_non_featured_20160712.json`);

exports.up = function(next) {
    let hotelData = require(LosAngelesDataFilePath);
    getHotelsByDipLocation(hotelData, true, (error, collection, hotels, hotelMap) => {
        if (error) {
            return next(error);
        }
        if (hotels.length > 0) {
            let backupHotels = hotels.map(hotel => {
                return hotel;
            });
            saveJsonContentToFile(migrateDownPath, backupHotels, (err) => {
                if (err) {
                    return next(err);
                }

                return updateHotels(collection, hotels, hotelMap, (err) => {
                    if (err) {
                        return next(err);
                    }
                    next();
                });
            });
        }
    });
};

exports.down = function(next) {
    var hotelData = require(migrateDownPath);
    getHotelsByDipLocation(hotelData, false, (error, collection, hotels, hotelMap) => {
        if (error) {
            return next(error);
        }
        if (hotels.length > 0) {
            return updateHotels(collection, hotels, hotelMap, (err) => {
                if (err) {
                    return next(err);
                }
                next();
            });
        }
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

function getHotelsByDipLocation(hotelData, isBackup, callback) {
    let hotelNames = hotelData.map(hotel => hotel.name);
    var hotelMap = hotelData.reduce((obj, hotel) => {
        obj[hotel.name] = hotel;
        return obj;
    }, Object.create({}));
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            if(error) {
                callback(error);
            } else {
                collection.find({"dipLocation": dipLocation, name: {$in: hotelNames}}).toArray((error, hotels) => {
                    if (!isBackup) {
                        return callback(error, collection, hotels, hotelMap);
                    }
                    let listHotelServices = [];
                    let hotelMapService = {};
                    if (hotels.length > 0) {
                        hotels.map(hotel => {
                            if (hotel.services && hotel.services.length > 0) {
                                hotel.services.forEach(service => {
                                    if (service) {
                                        listHotelServices.push(mongoose.Types.ObjectId(service));
                                        hotelMapService[service.toString()] = hotel;
                                    }
                                });
                            }
                        });
                    }
                    connection.db.collection('hotelservices', (error, collection) => {
                        collection.find({"_id": {$in: listHotelServices}}).toArray((error, services) => {
                            services.forEach(service => {
                                let hotel = hotelMapService[service._id.toString()];
                                if (hotel) {
                                    hotel.service_amenities = service.amenities || [];
                                }
                            });
                            callback(error, collection, hotels, hotelMap);
                        });
                    });
                });
            }
        });
    });
}

function updateHotels(collection, hotels, hotelMap, callback) {
    let listHotelServices = [];
    let hotelMapService = {};
    let p = hotels.map(hotel => {
        let mapHotel = hotelMap[hotel.name];
        if (mapHotel) {
            for (var key in mapHotel){
                if (key != "_id" && key != "service_amenities") {
                    if (key == "neighborhood") {
                        hotel.address[key] = mapHotel[key];
                    } else {
                        if (key == "services") {
                            let services = mapHotel[key];
                            let listServices = [];
                            services.forEach(service => {
                                if (service) {
                                    listServices.push(mongoose.Types.ObjectId(service));
                                }
                            });
                            hotel.services = listServices;
                        } else {
                            hotel[key] = mapHotel[key];
                        }
                    }

                }
            }
            if (hotel.services && hotel.services.length > 0) {
                hotel.services.forEach(service => {
                    if (service) {
                        listHotelServices.push(mongoose.Types.ObjectId(service));
                        hotelMapService[service.toString()] = mapHotel;
                    }
                });
            }
            return collection.save(hotel);
        } else {
            return Promise.resolve();
        }
    });
    Promise.all(p).then(() => {
        updateHotelServices(listHotelServices, hotelMapService, (error) => {
            callback(error);
        });
    });
}

function updateHotelServices(hotelServices, hotelMap, callback) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            collection.find({"_id": {$in: hotelServices}}).toArray((error, services) => {
                var listPromises = [];
                services.forEach(service => {
                    let hotel = hotelMap[service._id.toString()];
                    if (hotel) {
                        if (hotel.service_amenities) {
                            service.amenities = hotel.service_amenities;
                        } else {
                            service.amenities = [];
                        }

                        let p = new Promise((resolve, reject) => {
                            collection.update({_id: service._id}, {$set: service}, (error, result) => {
                                if (error) {
                                    reject(error);
                                }
                                resolve(result);
                            });
                        });
                        listPromises.push(p);
                    }
                });
                Promise.all(listPromises).then((values) => {
                    return callback();
                }, reasons => {
                    callback(reasons);
                });
            });
        });
    });
}