'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    let listHotelNames = getListHotelNames();
    let dipLocation = "los_angeles";
    return updateDipLocationsForHotels(listHotelNames, dipLocation, next);
};

exports.down = function (next) {
    let listHotelNames = getListHotelNames();
    let dipLocation = undefined;
    return updateDipLocationsForHotels(listHotelNames, dipLocation, next);
};

function getListHotelNames() {
    let listHotels = require(__dirname + '/assets/hotels.json');
    let listHotelNames = [];
    listHotels.forEach(hotel => {
        listHotelNames.push(hotel.name);
    });
    return listHotelNames;
}

function updateDipLocationsForHotels(listHotelNames, dipLocation, next) {
    return connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.find({"name": {$in: listHotelNames}}).toArray((error, hotels) => {
                let p = hotels.map(hotel => {
                    hotel.dipLocation = dipLocation;
                    return collection.save(hotel)
                });
                Promise.all(p).then(() => {
                    next();
                });
            })
        });
    });
}