'use strict';

const dotenv = require('dotenv');
const path = require('path');
const utils = require('../helpers/utils');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
            collection.find({'account.refCode': {$exists: false}}).toArray((error, users) => {
                if (error) {
                    next(error);
                } else {
                	let p;
                    p = users.map(user => {
                    	let code = utils.generateMemberCode(user.email, 8);
                        user.account.refCode = code;
                        return collection.save(user);
                    });
                    return Promise.all(p).then(() => {
                    	next();
                    }) 
                }
            });
        });
    });
};

exports.down = function(next) {
    connectionPromise.then(connection => {
        connection.db.collection('users', (error, collection) => {
            if(error) {
                next(error);
            } else {
               	collection.updateMany({ 
               		'account.refCode': {$exists: true}
               	}, {$unset: {'account.refCode' : '' }}, next)	
            }
        });
    });
};
