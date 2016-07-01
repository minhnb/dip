'use strict';

const connectionPromise = require('./db');

exports.up = function(next) {
    var duration = {
        "startTime" : 720,
        "endTime" : 1080
    };
    var title = "Dip Launch Party";

    return connectionPromise.then(connection => {
        connection.db.collection('events', (error, collection) => {
            collection.update({"email" : "admin@thedipapp.com"}, {$set: {duration: duration, title: title}}, (error, result) => {
                if (error) return next(error);
                if (result.nModified < 1) {
                    return next("Not Found Dip Event");
                }
                return next();
            });
        });
    });
};

exports.down = function (next) {
    next();
};