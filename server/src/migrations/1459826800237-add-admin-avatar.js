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

//sleep(1000);

exports.up = function(next) {
    let file_path = path.join(__dirname, `assets/dip_logo@2x.png`);
    let data = fs.readFileSync(file_path);
    return s3.upload(`logo/dip_logo`, data, 'image/png').then(img => {
        connectionPromise.then(connection => {
            connection.db.collection('users', (error, collection) => {
            	collection.findAndModify(
                    {email: 'admin@thedipapp.com'},
                    [],
                    {$set: {avatar: {
                    	url: img.Location,
                    	mediaType: 'image/png',
                    	provider: 'dip'
                    }
                }}, next)
            });
        });

    })  
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
    		collection.findAndModify(
    	        {email: 'admin@thedipapp.com'},
    	        [],
    	        {$set: {avatar: undefined}}, next)
        });
    });
};
