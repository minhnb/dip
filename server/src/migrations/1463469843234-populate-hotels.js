'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose')
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
    let file_path = path.join(__dirname, `assets/hotels.json`);
    fs.readFile(file_path, 'utf8', function (err, data) {
        if (err) {
            return next(err);
        }
        var hotels = JSON.parse(data);
       	let hotelsName = hotels.map(hotel => hotel.name);
       	let tmpHotelsName = [{
       		oldName: 'San Vicente Inn & Bungalows',
       		newName: 'San Vicente Inn (Bungalows)'
       	},
       	{
       		oldName: 'Hotel Wilshire',
       		newName: 'The Hotel Wilshire, a Kimpton Hotel'
       	},
       	{
       		oldName: 'W Los Angeles - West Beverly Hills',
       		newName: 'W Los Angeles - Westwood'
       	}];
       	for(let i = 0; i < tmpHotelsName.length; i++) {
       		if(hotelsName.indexOf(tmpHotelsName[i].oldName)) {
       			hotelsName.push(tmpHotelsName[i].newName) 
       		}
       	}
        return connectionPromise.then(connection => {
	        connection.db.collection('pools', (error, collection) => {
	            collection.find({'name': {$in: hotelsName}}).toArray((error, pools) => {
	                if (error) {
	                    next(error);

	                } else {
	                	console.info('create pool map');
	                	var poolMap = pools.reduce((obj, pool) => {
	                		if(pool.name == 'San Vicente Inn (Bungalows)') pool.name = 'San Vicente Inn & Bungalows';
	                		if(pool.name == 'The Hotel Wilshire, a Kimpton Hotel') pool.name = 'Hotel Wilshire';
	                		if(pool.name == 'W Los Angeles - Westwood') pool.name = 'W Los Angeles - West Beverly Hills';
				            obj[pool.name] = pool._id;
				            return obj;
				        }, Object.create({}));
				        console.info('poolMap Done');
				        console.info('Read hotels data');
				        continuing(hotel => {
				            hotel.coordinates = [];
				            hotel.address = {
				                street: '',
				                city: '',
				                state: '',
				                postalCode: 0,
				                country: 'US'
				            };
				            hotel.active = true;
				            hotel.reservable = true;
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
				        }, hotels, 0, 1).then(hotels => {
				            console.info('got geo information');
				            let imgPromises = hotels.map(hotel => {
				                hotel.tmpName = hotel.name.replace(/ /g, "_").toLowerCase();
				                let img_path = path.join(__dirname, `assets/hotels/${hotel.tmpName}.jpg`);
				                try {
				                    let data = fs.readFileSync(img_path);
				                    return s3.upload(`hotels/${hotel.tmpName}`, data, 'image/jpg');
				                } catch (err) {
				                    // Ignore image errors
				                    return Promise.resolve();
				                }
				            });
				            return Promise.all(imgPromises).then(imgs => {
				                console.info('uploaded hotels images');
				                //append img url
				                for (let i = 0; i < hotels.length; i++) {
				                    if (imgs[i] !== undefined) {
				                        hotels[i].image = {
				                            url: imgs[i].Location,
				                            verified: true
				                        };
				                    }
				                }

				                //append amenities & pool policy
				                hotels.map(hotel => {
				                    //append pool policy
				                    hotel.amenities = hotel.amenityList.split(',');
				                    hotel.services = {pools: []}
				                    hotel.services.pools.push({
				                    	policy: hotel.policy,
				                    	ref: poolMap[hotel.name] ? mongoose.Types.ObjectId(poolMap[hotel.name]) : undefined
				                    });
				               
				                    delete hotel.tmpName;
				                    delete hotel.fullAddress;
				                    delete hotel.policy;
				                    delete hotel.amenityList;

				                });
				                console.info('begin inserting hotel');
				                return connectionPromise.then(connection => {
				                    connection.db.collection('hotels', (error, collection) => {
				                        collection.insert(hotels, next);
				                    });
				                });
				            });
				        }).catch(next);
	                }
	            })
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
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('hotels', (error, collection) => {
            collection.remove({}, next);
        });
    });
};
