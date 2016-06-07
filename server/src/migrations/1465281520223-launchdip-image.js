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

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('events', (error, collection) => {
            collection.find({'title': 'Launch Dip'}).toArray((error, events) => {
                if (error) {
                    next(error);
                } else {
                    let launchDipEvent = events[0],
                    	file_path = path.join(__dirname, `assets/events/launch_dip.jpg`),
                    	data = fs.readFileSync(file_path),
                    	p = s3.upload(`events/launch_dip`, data, 'image/jpg');
                    return p.then(data => {
                        launchDipEvent.image = {
                            url: data.Location,
                            verified: true
                        };
                        return connectionPromise.then(connection => {
                            connection.db.collection('events', (error, collection) => {
                                collection.save(launchDipEvent, next);
                            });
                        });
                    }).catch(next);
                }   
            });
        });
    });
    
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('events', (error, collection) => {
    		collection.findAndModify(
    	        {title: 'Launch Dip'},
    	        [],
    	        {$unset: {image: ''}}, next)
        });
    });
};
