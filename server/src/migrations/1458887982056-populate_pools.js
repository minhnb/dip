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

var geocoderProvider = 'google';
var httpAdapter = 'https';

const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);
//sleep(1000);
exports.up = function(next) {
    let file_path = path.join(__dirname, `assets/pools.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var pools = JSON.parse(data);
        console.info('Read pool data');
        continuing(pool => {
            pool.coordinates = [];
            pool.address = {
                street: '',
                city: '',
                state: '',
                postalCode: 0,
                country: 'US'
            };
            pool.active = true;
            return geocoder.geocode(pool.fullAddress)
            .then(data => {
                pool.address.street = pool.fullAddress.split(",")[0];
                pool.address.city = pool.city;
                if(data.length > 0) {
                    pool.address.state = data[0].administrativeLevels.level1short;
                    pool.coordinates.push(data[0].longitude);
                    pool.coordinates.push(data[0].latitude);
                }

                let tmpAddArr = pool.fullAddress.split(" ");
                pool.address.postalCode = tmpAddArr[tmpAddArr.length -1];
                return new Promise((resolve, reject) => {
                    setTimeout(() => resolve(pool), 1000);
                });
            });
        }, pools, 0, 1).then(pools => {
            console.info('got geo information');
            let imgPromises = pools.map(pool => {
                pool.tmpName = pool.name.replace(/ /g, "_").toLowerCase();
                let img_path = path.join(__dirname, `assets/pools/${pool.tmpName}.jpg`);
                try {
                    let data = fs.readFileSync(img_path);
                    return s3.upload(`pools/${pool.tmpName}`, data, 'image/jpg');
                } catch (err) {
                    // Ignore image errors
                    return Promise.resolve();
                }
            });
            return Promise.all(imgPromises).then(imgs => {
                console.info('uploaded pool images');
                //append img url
                for (let i = 0; i < pools.length; i++) {
                    if (imgs[i] !== undefined) {
                        pools[i].image = {
                            url: imgs[i].Location,
                            verified: true
                        };
                    }
                }
                //append amenities
                pools.map(pool => {
                    pool.amenities = [];
                    let now = new Date();
                    pool.createdAt = now;
                    pool.updatedAt = now;
                    if (pool.chair != '') {
                        pool.amenities.push({
                            type: 'chair',
                            count: pool.chair,
                            createdAt: now,
                            updatedAt: now
                        });
                    }
                    if (pool.daybed != '') {
                        pool.amenities.push({
                            type: 'daybed',
                            count: pool.daybed,
                            createdAt: now,
                            updatedAt: now
                        })
                    }
                    if (pool.cabana != '') {
                        pool.amenities.push({
                            type: 'cabana',
                            count: pool.cabana,
                            createdAt: now,
                            updatedAt: now
                        })
                    }
                    delete pool.chair;
                    delete pool.daybed;
                    delete pool.cabana;
                    delete pool.tmpName;
                    delete pool.fullAddress;
                });
                console.info('begin inserting pool');
                return connectionPromise.then(connection => {
                    connection.db.collection('pools', (error, collection) => {
                        collection.insert(pools, next);
                    });
                });
            });
        }).catch(next);
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
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('pools', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
