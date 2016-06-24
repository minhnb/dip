'use strict';

const dotenv = require('dotenv');
const path = require('path');
const db = require('../db');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

exports.up = function(next) {
    var duration = {
        "startTime" : 720,
        "endTime" : 1080
    };
    var title = "Dip Launch Party";
    db.events.update({"email" : "admin@thedipapp.com"}, {$set: {duration: duration, title: title}}, (error, result) => {
        if (error) return next(error);
        if (result.nModified < 1) {
            return next("Not Found Dip Event");
        }
        return next();
    });
};

exports.down = function (next) {
    next();
};