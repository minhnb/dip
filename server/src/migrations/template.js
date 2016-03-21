'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const db = require('../db');

exports.up = function(next) {
    next();
};

exports.down = function(next) {
    next();
};
