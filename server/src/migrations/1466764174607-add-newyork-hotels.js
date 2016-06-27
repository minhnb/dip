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
const db = require('../db');

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
        uploadHotelImages(listHotels, (images) => {
            return saveListHotels(images, listHotels, next);
        });
    }).catch(next);

};

exports.down = function(next) {
    db.hotels.remove({dipLocation: newYorkId}, (error, results) => {
        if (error) {
            return next(error);
        }
        next();
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

function uploadHotelImages(hotels, callback) {
    let imgPromises = hotels.map(hotel => {
        return new Promise((resolve, reject) => {
            hotel.tmpName = hotel.name.replace(/ /g, "_").toLowerCase();
            let img_path = path.join(__dirname, `assets/1466764174607-add-newyork-hotels/${hotel.tmpName}.jpg`);
            try {
                let data = fs.readFileSync(img_path);
                im.resize({
                    srcPath: img_path,
                    width: 736
                }, function(err, stdout, stderr){
                    // console.log(err);
                    let bufferData = new Buffer(stdout, 'binary');
                    s3.upload(`hotels/${hotel.tmpName}`, data, 'image/jpg').then(img => {
                        s3.upload(`hotels/${hotel.tmpName}_resized`, bufferData, 'image/jpg').then(resize_img => {
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
        console.info('uploaded hotel images');
        //append img url
        callback(imgs);
    });
}

function saveListHotels(imgs, hotels, next) {
    for (let i = 0; i < hotels.length; i++) {
        if (imgs[i] !== undefined) {
            hotels[i].image = {
                url: imgs[i].Location,
                verified: true
            };
        }
    }
    hotels.map(hotel => {
        delete hotel.fullAddress;
    });
    console.info('begin inserting NY hotel');
    return db.hotels.create(hotels, (error, results) => {
        if (error) {
            return next(error);
        }
        next();
    });
}
