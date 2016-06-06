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
            let poolsName = ["Ace Hotel Downtown LA", "Custom Hotel", "Hollywood Roosevelt Hotel - A Thompson Hotel", "Hotel Wilshire", "Luxe Sunset Boulevard Hotel", "Montage Beverly Hills", "Mosaic Hotel Beverly Hills", "Sportsmen's Lodge Hotel", "Sunset Marquis", "Sunset Towers Hotel", "The Peninsula Beverly Hills", "The Standard Downtown LA", "The Standard Hollywood"];
            collection.find({name: {$in: poolsName}}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let imgPromises = pools.map(pool => {
                        let tmpName = pool.name.replace(/ /g, "_").toLowerCase();
                        let file_path = path.join(__dirname, `assets/pools-2016-06-06/${tmpName}.jpg`);
                        try {
                            let data = fs.readFileSync(file_path);
                            return s3.upload(`pools/${tmpName}`, data, 'image/jpg');
                        } catch (err) {
                            return Promise.reject(err);
                        }
                    });
                    Promise.all(imgPromises).then(imgs => {
                        for (let i = 0; i < pools.length; i++) {
                            if (imgs[i] !== undefined) {
                                pools[i].image = {
                                    url: imgs[i].Location,
                                    verified: true
                                };
                            }
                        }
                        Promise.all(pools.map(pool => collection.save(pool))).then(() => next());
                    })
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            let poolsName = ["Ace Hotel Downtown LA", "Custom Hotel", "Hollywood Roosevelt Hotel - A Thompson Hotel", "Hotel Wilshire", "Luxe Sunset Boulevard Hotel", "Montage Beverly Hills", "Mosaic Hotel Beverly Hills", "Sportsmen's Lodge Hotel", "Sunset Marquis", "Sunset Towers Hotel", "The Peninsula Beverly Hills", "The Standard Downtown LA", "The Standard Hollywood"];
            collection.find({name: {$in: poolsName}}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    let p = pools.map(pool => {
                        pool.image.url = "";
                        collection.save(pool);
                    })
                    Promise.all(p).then(() => {
                        next();
                    });
                }
            });
        });
    });
};
