'use strict';

const connectionPromise = require('./db');

exports.up = function(next) {
  var date = "2016-07-16";
  var title = "Dip Launch Party";

  return connectionPromise.then(connection => {
    connection.db.collection('events', (error, collection) => {
      collection.update({title : title}, {$set: {date: date}}, (error, result) => {
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