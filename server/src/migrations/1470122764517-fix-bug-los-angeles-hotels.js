'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const s3 = require('../helpers/s3');
const im = require('imagemagick');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const up = async (function(next) {
    try {
        let hotelServicesCollection = await(getCollection('hotelservices'));
        let updatedWilshire = updateWilshireHotelService(hotelServicesCollection);
        let updatedShangriLa = updateShangriLaHotelService(hotelServicesCollection);
        let updatedHollywoodRoosevelt = updateHollywoodRooseveltHotelService(hotelServicesCollection);
        if (updatedWilshire.result.nModified == 1) {
            console.log("updated Wilshire");
        }
        if (updatedShangriLa.result.nModified == 1) {
            console.log("updated ShangriLa");
        }
        if (updatedHollywoodRoosevelt.result.nModified == 1) {
            console.log("updated Hollywood Roosevelt");
        }
        return next();
    } catch (error) {
        return next(error);
    }
});

const down = async (function(next) {
    return next();
});

exports = module.exports = {
    up: up,
    down: down
};

///////////// Helper functions /////////////
let getCollection = async (collectionName => {
    let connection = await (connectionPromise);
    return connection.db.collection(collectionName);
});

let getDocuments = async ((collection, query) => {
    return new Promise((resolve, reject) => {
        collection.find(query).toArray((err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
});

let getOneDocument = async ((collection, query) => {
    return new Promise((resolve, reject) => {
        collection.findOne(query, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
});

let updateDocuments = async ((collection, query, update) => {
    return new Promise((resolve, reject) => {
        collection.updateMany(query, update, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
});

function updateHotelServices(hotelServicesCollection, name, update) {
    let result = await(updateDocuments(hotelServicesCollection, {name: name}, update));
    return result;
}

let uploadListImages = async ((listImageNames, fromPath, toPath) => {
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
        return imgs;
    });
});

function updateWilshireHotelService(hotelServicesCollection) {
    let hotelServices = {name: "Hotel Wilshire"};
    let toPath = "pools";
    let fromPath = "assets/pools-2016-06-06";
    let listImageNames = ['hotel_wilshire'];
    let imgs = await(uploadListImages(listImageNames, fromPath, toPath));
    console.log(imgs);
    if (imgs.length > 0 && imgs[0] != undefined) {
        hotelServices.image = {
            url: imgs[0].Location,
            verified: true
        };
    }
    return updateHotelServices(hotelServicesCollection, "The Hotel Wilshire, a Kimpton Hotel", {$set: hotelServices});
}

function updateShangriLaHotelService(hotelServicesCollection) {
    let hotelServices = {name: "Hotel Shangri-La"};
    return updateHotelServices(hotelServicesCollection, "Hotel Shangri-La Santa Monica", {$set: hotelServices});
}

function updateHollywoodRooseveltHotelService(hotelServicesCollection) {
    let hotelServices = {name: "Hollywood Roosevelt Hotel"};
    return updateHotelServices(hotelServicesCollection, "Hollywood Roosevelt Hotel - A Thompson Hotel", {$set: hotelServices});
}