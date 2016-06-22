'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

exports.up = function(next) {
    var hotelData = require(__dirname + '/assets/pool-policy-20160622.json');
    let backup_data_file_path = path.join(__dirname, `assets/migration-down-1466568447186-update-passes-for-hotels.json`);
    fs.access(backup_data_file_path, fs.F_OK, function (err) {
        if (err) {
            //backup data
            var json_backup_data = [];
            var shangriLaHotelServicesId = {};
            db.hotels.find({})
                .populate({
                    path: 'services',
                    model: db.hotelServices
                }).exec((error, hotels) => {
                    if (error) {
                        next(error);
                    } else {
                        hotels.forEach(function (hotel) {
                            let amenities = [];
                            if (hotel.services.length > 0) {
                                amenities = hotel.services[0].amenities || [];
                            }
                            let item = {
                                name: hotel.name,
                                amenities: amenities
                            };
                            json_backup_data.push(item);
                            if (hotel.name == "Hotel Shangri-La") {
                                shangriLaHotelServicesId = hotel.services[0]._id;
                            }
                        });

                        db.offers.find({type: "pass", service: shangriLaHotelServicesId}).exec((error, offers) => {
                            if (error) {
                                next(error);
                            } else {
                                json_backup_data.forEach(function (hotel) {
                                    if (hotel.name == "Hotel Shangri-La") {
                                        hotel.offers = offers;
                                    }
                                });
                                Promise.resolve().then(() => {
                                    console.log(json_backup_data.length);
                                    fs.writeFile(backup_data_file_path, JSON.stringify(json_backup_data), 'utf8', function (error) {
                                        if (error) {
                                            console.log("Back up data failed");
                                            next(error);
                                        } else  {
                                            return updatePassesForHotel(hotelData, next);
                                        }
                                    });
                                });
                            }
                        });
                    }
            })
        } else {
            return updatePassesForHotel(hotelData, next);
        }
    });
};

exports.down = function(next) {
    var hotelData = require(__dirname + '/assets/migration-down-1466568447186-update-passes-for-hotels.json');
    return updatePassesForHotel(hotelData, next);
};

function updatePassesForHotel(hotelData, next) {
    let hotelNames = hotelData.map(hotel => hotel.name);
    var hotelMap = hotelData.reduce((obj, hotel) => {
        obj[hotel.name] = hotel;
        return obj;
    }, Object.create({}));
    db.offers.remove({type: "pass"}, (error) => {
        db.hotels.find({'name': {$in: hotelNames}})
            .populate({
                path: 'services',
                model: db.hotelServices
            }).exec((error, hotels) => {
                let listHotelServices = [];
                var listOffers = [];
                hotels.forEach(hotel => {
                    hotelMap[hotel.name].id = hotel._id;
                    if (hotel.services.length > 0) {
                        let hotelServices = hotel.services[0];
                        hotelMap[hotel.name].service = hotelServices._id;
                        hotelServices.amenities = hotelMap[hotel.name].amenities;
                        listHotelServices.push(hotelServices);

                        if (hotelMap[hotel.name].offers && hotelMap[hotel.name].offers.length > 0) {
                            hotelMap[hotel.name].offers.forEach((hotelOffer) => {
                                let offer = hotelOffer;
                                offer.service = hotelMap[hotel.name].service;
                                offer.hotel = hotel.id;
                                offer.type = "pass";
                                let day = "2016-06-22";
                                let dueDay = "2017-06-22";
                                if (!offer.price) {
                                    offer.price = 0;
                                }
                                if (!offer.dueDay) {
                                    offer.dueDay = dueDay;
                                }
                                if (!offer.startDay) {
                                    offer.startDay = day;
                                }
                                if (!offer.date) {
                                    offer.date = day;
                                }
                                listOffers.push(offer);
                            });
                        }
                    }
                });
                var listPromises = [];
                listHotelServices.forEach(hotelServices => {
                    let p = new Promise((resolve, reject) => {
                        db.hotelServices.update({_id: hotelServices._id}, {$set: hotelServices}, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            resolve(result);
                        });
                    });
                    listPromises.push(p);
                });
                Promise.all(listPromises).then((values) => {
                    db.offers.create(listOffers, (error, result) => {
                        if (error) {
                            next(error);
                        } else {
                            next();
                        }
                    });
                });
        });
    });
}