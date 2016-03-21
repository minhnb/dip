'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const db = require('../db');

exports.up = function(next) {
    let admin = new db.users({
        firstName: 'Dip',
        gender: 'na',
        email: 'admin@thedipapp.com'
    });
    admin.save(err => {
        next(err);
    });
    //next();
};

exports.down = function(next) {
    db.users.remove({email: 'admin@thedipapp.com'}).exec().then(() => next());
};
