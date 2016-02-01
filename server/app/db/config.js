'use strict';

const mongoose = require('mongoose');
const config = require('../config');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongo.uri);

const db = mongoose.connection;

db.on('error', function (err) {
    console.error('db connection error:', err.message);
    process.exit(-1);
});
db.once('open', function callback() {
    console.info("Connected to DB!");
});

module.exports = db;