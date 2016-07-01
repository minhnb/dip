'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
const im = require('imagemagick');

dotenv.load({
    path: `${rootFolder}/.env`
});

const fs = require('fs');
const s3 = require('../helpers/s3');

var geocoderProvider = 'google';
var httpAdapter = 'https';

const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);
const connectionPromise = require('./db');
const mongoose = require('mongoose');

let newYorkId = "new_york";
exports.up = function(next) {
	let listHotels = require(__dirname + '/assets/NewYorkHotels.json');
    listHotels.map(hotel => {
        hotel.dipLocation = newYorkId;
        hotel.reservable = true;
        hotel.amenities = [];
        let now = new Date();
        hotel.createdAt = now;
        hotel.updatedAt = now;
    });
    console.info('start get geo information');
    continuing(mapHotelAddress, listHotels, 0, 1).then(() => {
        console.info('got geo information');
        uploadHotelAndPoolImages(listHotels, (hotelImages, poolImages) => {
            return saveListHotels(hotelImages, poolImages, listHotels, next);
        });
    }).catch(next);

};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({dipLocation: newYorkId}).toArray((error, hotels) => {
                if (error) {
                    return next(error);
                }
                var listServices = [];
                hotels.forEach(hotel => {
                    if (hotel.services && hotel.services.length > 0) {
                        hotel.services.forEach(service => {
                           if (service) {
                               listServices.push(service);
                           }
                        });
                    }
                });

                collection.remove({dipLocation: newYorkId}, (error) => {
                    if (error) {
                        return next(error);
                    }

                    connection.db.collection('hotelservices', (error, collection) => {
                        collection.remove({"_id": {$in: listServices}}, (error) => {
                            if (error) {
                                return next(error);
                            }

                            next();
                        });
                    });
                });
            });
        });
    });
};

function continuing(fn, array, pos, step, data) {
    if (!data) data = [];
    if (pos >= array.length) return Promise.resolve(data);
    var sub_arr = array.slice(pos, pos + step);
    var promises = sub_arr.map(fn);
    return Promise.all(promises).then(current_data => {
        return continuing(fn, array, pos + step, step, data.concat.apply(data, current_data));
    }).catch(err => {
        return Promise.reject(err);
    });
}

function mapHotelAddress(hotel) {
    hotel.coordinates = [];
    hotel.address = {
        street: '',
        city: '',
        state: '',
        postalCode: 0,
        country: 'US'
    };
    return geocoder.geocode(hotel.fullAddress)
        .then(data => {
            hotel.address.street = hotel.fullAddress.split(",")[0];
            hotel.address.city = hotel.city;
            if(data.length > 0) {
                hotel.address.state = data[0].administrativeLevels.level1short;
                hotel.coordinates.push(data[0].longitude);
                hotel.coordinates.push(data[0].latitude);
            }

            let tmpAddArr = hotel.fullAddress.split(" ");
            hotel.address.postalCode = tmpAddArr[tmpAddArr.length -1];
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(hotel), 1000);
            });
        });
}

function uploadHotelAndPoolImages(hotels, callback) {
    let listImageNames = hotels.map(hotel => {
        return hotel.name.replace(/ /g, "_").toLowerCase();
    });
    let imagePath = "assets/1466764174607-add-newyork-hotels";
    uploadHotelImages(listImageNames, imagePath, (hotelImages) => {
        uploadPoolImages(listImageNames, imagePath, (poolImages) => {
            callback(hotelImages, poolImages);
        });
    });
}

function uploadHotelImages(listImageNames, imagePath, callback) {
    let toPath = "hotels";
    let fromPath = imagePath + "/hotels";
    return uploadListImages(listImageNames, fromPath, toPath, callback);
}

function uploadPoolImages(listImageNames, imagePath, callback) {
    let toPath = "pools";
    let fromPath = imagePath + "/pools";
    return uploadListImages(listImageNames, fromPath, toPath, callback);
}

function uploadListImages(listImageNames, fromPath, toPath, callback) {
    let imgPromises = listImageNames.map(imageName => {
        return new Promise((resolve, reject) => {
            let img_path = path.join(__dirname, `${fromPath}/${imageName}.jpg`);
            try {
                let data = fs.readFileSync(img_path);
                im.resize({
                    srcPath: img_path,
                    width: 736
                }, function(err, stdout, stderr){
                    // console.log(err);
                    let bufferData = new Buffer(stdout, 'binary');
                    s3.upload(`${toPath}/${imageName}`, data, 'image/jpg').then(img => {
                        s3.upload(`${toPath}/${imageName}_resized`, bufferData, 'image/jpg').then(resize_img => {
                            // console.log(resize_img);
                            resolve(img);
                        });
                    });
                });
            } catch (err) {
                // Ignore image errors
                console.log(err);
                resolve();
            }
        });
    });
    return Promise.all(imgPromises).then(imgs => {
        console.info('uploaded ' + toPath + ' images');
        //append img url
        callback(imgs);
    });
}

function createPoolService(hotel, poolImage) {
    let hotelService = {};
    hotelService.name = hotel.name;
    hotelService.neighborhood = hotel.neighborhood;
    hotelService.url = hotel.url;
    hotelService.phone = hotel.phone;
    hotelService.address = hotel.address;
    hotelService.coordinates = hotel.coordinates;
    hotelService.city = hotel.address.city;
    hotelService.active = true;
    hotelService.detail = "Swimming Pool";
    hotelService.type = "PoolService";

    if (poolImage != undefined) {
        hotelService.image = {
            url: poolImage.Location,
            verified: true
        };
    }

    return hotelService;
}

function saveListHotels(hotelImages, poolImages, hotels, next) {
    // console.log(hotelImages, poolImages);
    let hotelServices = [];
    for (let i = 0; i < hotels.length; i++) {
        if (hotelImages[i] !== undefined) {
            hotels[i].image = {
                url: hotelImages[i].Location,
                verified: true
            };
        }
        let hotelService = createPoolService(hotels[i], poolImages[i]);
        hotelServices.push(hotelService);
        hotels[i].services = [];
    }
    hotels.map(hotel => {
        delete hotel.fullAddress;
    });
    console.info('begin inserting NY hotel');
    var hotelMap = hotels.reduce((obj, hotel) => {
        obj[hotel.name] = hotel;
        return obj;
    }, Object.create({}));
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            collection.insert(hotelServices, (error, results) => {
                if (error) {
                    return next(error);
                }
                let listHotelServices = results.ops;
                listHotelServices.forEach(service => {
                    hotelMap[service.name].services.push(service._id);
                });
                connection.db.collection('hotels', (error, collection) => {
                    collection.insert(hotels, (error, results) => {
                        if (error) {
                            return next(error);
                        }
                        next();
                    });
                });
            });
        });
    });
}
