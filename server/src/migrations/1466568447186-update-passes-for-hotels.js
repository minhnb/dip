'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectionPromise = require('./db');
const mongoose = require('mongoose');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

let day = "2016-06-22";
let dueDay = "2017-06-22";

exports.up = function(next) {
    var hotelData = require(__dirname + '/assets/pool-policy-20160622.json');
    let backup_data_file_path = path.join(__dirname, `assets/migration-down-1466568447186-update-passes-for-hotels.json`);
    fs.access(backup_data_file_path, fs.F_OK, function (err) {
        if (err) {
            //backup data
            var json_backup_data = [];
            var shangriLaHotelServicesId = {};
            connectionPromise.then(connection => {
                findListHotels(connection, {}, (error, hotels) => {
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

                        connection.db.collection('offers', (error, collection) => {
                            collection.find({type: "pass", service: shangriLaHotelServicesId}).toArray((error, offers) => {
                                if (error) {
                                    next(error);
                                } else {
                                    json_backup_data.forEach(function (hotel) {
                                        if (hotel.name == "Hotel Shangri-La") {
                                            hotel.offers = offers;
                                        }
                                    });
                                    Promise.resolve().then(() => {
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
                        });
                    }
                });
            });
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
    connectionPromise.then(connection => {
        connection.db.collection('offers', (error, collection) => {
            collection.remove({type: "pass", "reservationCount": {$exists:false}}, (error) => {
                if (error) {
                    return next(error);
                }
                findListHotels(connection, {'name': {$in: hotelNames}}, (error, hotels) => {
                    if (error) {
                        return next(error);
                    }
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
                                    offer.hotel = hotel._id;
                                    offer.type = "pass";
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

                    updateListHotelServices(connection, listHotelServices, () => {
                        return handleListOffers(connection, listOffers, next);
                    });
                })
            });
        });
    });
}

function findListHotels(connection, condition, callback) {
    connection.db.collection('hotels', (error, collection) => {
        collection.find(condition).toArray((error, hotels) => {
            // console.log(error, hotels);
            if (error) {
                callback(error, null);
            } else {
                var listHotelServices = [];
                var hotelMapByService = [];
                hotels.forEach(hotel => {
                    if (hotel.services && hotel.services.length > 0) {
                        hotel.services.forEach(service => {
                            if (service) {
                                listHotelServices.push(service);
                                hotelMapByService[service.toString()] = hotel;
                            }
                        });
                    }
                    hotel.services = [];
                });
                if (listHotelServices.length == 0) {
                    callback(error, hotels);
                } else {
                    connection.db.collection('hotelservices', (error, collection) => {
                        collection.find({"_id": {$in: listHotelServices}}).toArray((error, services) => {
                            services.forEach(service => {
                                hotelMapByService[service._id.toString()].services.push(service);
                            });
                            // console.log(error, hotels);
                            callback(error, hotels);
                        });
                    });
                }
            }
        });
    });
}

function updateListHotelServices(connection, listHotelServices, callback, next) {
    connection.db.collection('hotelservices', (error, collection) => {
        var listPromises = [];
        listHotelServices.forEach(hotelServices => {
            let p = new Promise((resolve, reject) => {
                collection.update({_id: hotelServices._id}, {$set: hotelServices}, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });
            });
            listPromises.push(p);
        });
        Promise.all(listPromises).then((values) => {
            return callback();
        }, reasons => {
            next(reasons);
        });
    });
}

function handleListOffers(connection, listOffers, next) {
    var listNewOffers = [];
    var listUpdateOffers = [];

    connection.db.collection('offers', (error, collection) => {
        collection.find({type: "pass"}).toArray((error, offers) => {
            if (error) {
                next(error);
            } else {
                let listExistedPostions = [];
                offers.forEach(offer => {
                    let existedOfferInListOfferPosition = offerIsExist(offer, listOffers);
                    if (existedOfferInListOfferPosition > -1) {
                        let existedOffer = listOffers[existedOfferInListOfferPosition];
                        listOffers[existedOfferInListOfferPosition].existed = true;
                        offer.dueDay = existedOffer.dueDay;
                        offer.allotmentCount = existedOffer.allotmentCount;
                        offer.duration = existedOffer.duration;
                        offer.price = existedOffer.price;
                        offer.days = existedOffer.days;
                        offer.amenities = existedOffer.amenities;
                        listExistedPostions.push[existedOffer];
                    } else {
                        offer.dueDay = day;
                    }
                    listUpdateOffers.push(offer);
                });

                listOffers.forEach(offer => {
                    if (!offer.existed) {
                        listNewOffers.push(offer);
                    }
                });

                let promiseCreateOffers = new Promise((resolve, reject) => {
                    if (listNewOffers.length > 0) {
                        listNewOffers.forEach(offer => {
                            if (offer._id) {
                                offer._id = mongoose.Types.ObjectId(offer._id);
                            }
                        });
                        collection.insert(listNewOffers, (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        });
                    } else {
                        resolve(1);
                    }
                });

                promiseCreateOffers.then((value) => {
                    if (listUpdateOffers.length > 0) {
                        var listPromiseUpdateOffers = [];
                        listUpdateOffers.forEach(offer => {
                            let p = new Promise((resolve, reject) => {
                                collection.update({_id: offer._id}, {$set: offer}, (error, result) => {
                                    if (error) {
                                        reject(error);
                                    }
                                    resolve(result);
                                });
                            });
                            listPromiseUpdateOffers.push(p);
                        });
                        Promise.all(listPromiseUpdateOffers).then(values => {
                            next();
                        }, reasons => {
                            next(reasons);
                        });
                    } else {
                        next();
                    }
                }, (reason) => {
                    next(reason);
                });
            }
        });
    });
}

function offerIsExist(offer, listOffers) {
    for (let i = 0; i < listOffers.length; i++) {
        let item = listOffers[i];
        if (item.description.toString() == offer.description.toString() && item.hotel.toString() == offer.hotel.toString() && item.service.toString() == offer.service.toString()) {
            return i;
        }
    }
    return -1;
}