'use strict';

const connectionPromise = require('./db');

exports.up = function(next) {
  var name = "Equinox Printing House";
  var dipLocation = "new_york";

  return connectionPromise.then(connection => {
    connection.db.collection('hotels', (error, collection) => {
      collection.update({name : name, dipLocation: dipLocation}, {$set: {active: false, reservable: false}}, (error, result) => {
        if (error) return next(error);
        if (result.nModified < 1) {
          return next("Not Found Hotel " + name);
        }
        return next();
      });
    });
  });
};

exports.down = function(next) {
  next();
};
