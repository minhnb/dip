'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    let new_data_file_path = path.join(__dirname, `assets/pool-policy-20160616.json`);
    fs.readFile(new_data_file_path, 'utf8', function (err, data) {
        if (err) {
            console.log("Data file not found");
            return next(err);
        }
        let backup_data_file_path = path.join(__dirname, `assets/migration-down-1466046631543-update-pool-policy.json`);
        fs.access(backup_data_file_path, fs.F_OK, function (err) {
            if (err) {
                //backup data
                var json_backup_data = [];
                var p = connectionPromise.then(connection => {
                    connection.db.collection('hotelservices', (error, collection) => {
                        collection.find({}).toArray((error, pools) => {
                            if (error) {
                                next(error);
                            } else {
                                pools.forEach(function (pool) {
                                    let item = {
                                        name: pool.name,
                                        amenities: pool.amenities,
                                        policy: pool.policy
                                    };
                                    json_backup_data.push(item);
                                });

                                Promise.resolve().then(() => {
                                    fs.writeFile(backup_data_file_path, JSON.stringify(json_backup_data), 'utf8', function (error) {
                                        if (error) {
                                            console.log("Back up data failed");
                                            next(error);
                                        } else  {
                                            return updateHotelServicesFromJsonFile(data, next);
                                        }
                                    });
                                });
                            }
                        });
                    });
                });
            } else {
                return updateHotelServicesFromJsonFile(data, next);
            }
        });
    });
};

exports.down = function(next) {
    let backup_data_file_path = path.join(__dirname, `assets/migration-down-1466046631543-update-pool-policy.json`);
    fs.readFile(backup_data_file_path, 'utf8', function (err, data) {
        if (err) {
            console.log("Backup file not found");
            return next(err);
        }

        return updateHotelServicesFromJsonFile(data, next);
    });
};

function updateHotelServicesFromJsonFile(json_file_data, next) {
    var poolData = JSON.parse(json_file_data);
    let poolNames = poolData.map(pool => pool.name);
    var poolMap = poolData.reduce((obj, pool) => {
        obj[pool.name] = pool;
        return obj;
    }, Object.create({}));
    return connectionPromise.then(connection => {
        connection.db.collection('hotelservices', (error, collection) => {
            collection.find({'name': {$in: poolNames}}).toArray((error, pools) => {
                if (error) {
                    next(error);
                } else {
                    pools.map(pool => {
                        pool.amenities = poolMap[pool.name].amenities;
                        pool.policy = poolMap[pool.name].policy;
                    });
                    Promise.all(pools.map(pool => collection.save(pool))).then(() => next());
                }
            });
        });
    });
}