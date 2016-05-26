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
        connection.db.collection('hotelservices', (error, collection) => {
            let hotelsName = ["Ace Hotel Downtown LA", "Fairmont Miramar Hotel & Bungalows", "Grafton on Sunset", "Hotel Angeleno", "Hotel Shangri-La Santa Monica", "Mondrian Los Angeles Hotel", "W Hollywood"];
            collection.find({name: {$in: hotelsName}}).toArray((error, services) => {
                if (error) {
                    next(error);
                } else {
                    let imgPromises = services.map(service => {
                        let tmpName = service.name.replace(/ /g, "_").toLowerCase();
                        let file_path = path.join(__dirname, `assets/pools/${tmpName}.jpg`);
                        try {
                            let data = fs.readFileSync(file_path);
                            return s3.upload(`pools/${tmpName}`, data, 'image/jpg');
                        } catch (err) {
                            return Promise.reject(err);
                        }
                    });
                    Promise.all(imgPromises).then(imgs => {
                        for (let i = 0; i < services.length; i++) {
                            if (imgs[i] !== undefined) {
                                services[i].image = {
                                    url: imgs[i].Location,
                                    verified: true
                                };
                            }
                        }
                        Promise.all(services.map(s => collection.save(s))).then(() => next());
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            let hotelsName = ["Ace Hotel Downtown LA", "Fairmont Miramar Hotel & Bungalows", "Grafton on Sunset", "Hotel Angeleno", "Hotel Shangri-La Santa Monica", "Mondrian Los Angeles Hotel", "W Hollywood"];
            collection.find({name: {$in: hotelsName}}).toArray((error, services) => {
                if (error) {
                    next(error);
                } else {
                    let p = services.map(service => {
                        service.image.url = "";
                        collection.save(services);
                    })
                    Promise.all(p).then(() => {
                        next();
                    });
                }
            });
        });
    });
};
