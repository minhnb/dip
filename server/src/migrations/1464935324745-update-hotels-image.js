'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            let hotelsName = ["Ace Hotel Downtown LA", "Custom Hotel", "Hollywood Roosevelt Hotel - A Thompson Hotel", "Hotel Wilshire", "Luxe Sunset Boulevard Hotel", "Montage Beverly Hills", "Mosaic Hotel Beverly Hills", "Sportsmen's Lodge Hotel", "Sunset Marquis", "Sunset Towers Hotel", "The Peninsula Beverly Hills", "The Standard Downtown LA", "The Standard Hollywood"];
            collection.find({name: {$in: hotelsName}}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let imgPromises = hotels.map(hotel => {
                        let tmpName = hotel.name.replace(/ /g, "_").toLowerCase();
                        let file_path = path.join(__dirname, `assets/hotels-2016-06-03/${tmpName}.jpg`);
                        try {
                            let data = fs.readFileSync(file_path);
                            return s3.upload(`hotels/${tmpName}`, data, 'image/jpg');
                        } catch (err) {
                            return Promise.reject(err);
                        }
                    });
                    Promise.all(imgPromises).then(imgs => {
                        for (let i = 0; i < hotels.length; i++) {
                            if (imgs[i] !== undefined) {
                                hotels[i].image = {
                                    url: imgs[i].Location,
                                    verified: true
                                };
                            }
                        }
                        Promise.all(hotels.map(hotel => collection.save(hotel))).then(() => next());
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            let hotelsName = ["Ace Hotel Downtown LA", "Custom Hotel", "Hollywood Roosevelt Hotel - A Thompson Hotel", "Hotel Wilshire", "Luxe Sunset Boulevard Hotel", "Montage Beverly Hills", "Mosaic Hotel Beverly Hills", "Sportsmen's Lodge Hotel", "Sunset Marquis", "Sunset Towers Hotel", "The Peninsula Beverly Hills", "The Standard Downtown LA", "The Standard Hollywood"];
            collection.find({name: {$in: hotelsName}}).toArray((error, hotels) => {
                if (error) {
                    next(error);
                } else {
                    let p = hotels.map(hotel => {
                        hotel.image.url = "";
                        collection.save(hotel);
                    })
                    Promise.all(p).then(() => {
                        next();
                    });
                }
            });
        });
    });
};
