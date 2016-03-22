'use strict';

const mongoose = require('mongoose');
const config = require('../config');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongo.uri);

const db = mongoose.connection;

module.exports = new Promise((resolve, reject) => {
    db.on('error', function (err) {
        console.error('db connection error:', err.message);
        reject(db);
    });
    db.once('open', function callback () {
        console.info("Connected to DB!");
        resolve(db);
    });
});