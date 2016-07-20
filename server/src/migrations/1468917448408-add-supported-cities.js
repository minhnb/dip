'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

let listCities = [
    {
        "city": "Los Angeles County",
        "state": "California"
    },
    {
        "city": "New York County",
        "state": "New York"
    },
    {
        "city": "Clark County",
        "state": "Nevada"
    },
    {
        "city": "Miami-Dade County",
        "state": "Florida"
    }
];

exports.up = function(next) {
  connectionPromise.then(connection => {
    connection.db.collection('cities', (error, collection) => {
        collection.find({}).toArray((error, cities) => {
            let cityMap = cities.reduce((obj, city) => {
                obj[city.city] = city;
                return obj;
            }, Object.create({}));

            let insertCities = [];
            listCities.map(city => {
                let mapCity = cityMap[city.city];
                if (!mapCity || mapCity.state != city.state) {
                    insertCities.push(city);
                }
            });

            if (insertCities.length == 0) {
                return next();
            }

            collection.insert(insertCities, (error, results) => {
                if (error) {
                    console.log(error);
                }
                next();
            });
        });
    });
  });
};

exports.down = function(next) {
    next();
};
