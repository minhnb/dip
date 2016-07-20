'use strict';

const dotenv = require('dotenv');
const path = require('path');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

const getCollection = async (collectionName => {
    let connection = await (connectionPromise);
    return connection.db.collection(collectionName);
});

const up = async (function(next) {
    let collection = await (getCollection('users'));
    return next();
});

const down = async (function(next) {
    let collection = await (getCollection('users'));
    return next();
});

exports = module.exports = {
    up: up,
    down: down
};