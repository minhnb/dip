'use strict';

const dotenv = require('dotenv');
const path = require('path');
const rootFolder = path.normalize(__dirname + '/../../..');
dotenv.load({
  path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

exports.up = function(next) {
  connectionPromise.then(connection => {
    connection.db.collection('hotels', (error, collection) => {
      if (error) {
        next(error);
      } else {
        collection.find({"name": "The Standard Le Bain"}).toArray((error, hotels) => {
          if (hotels.length > 0) {
            let hotel = hotels[0];
            hotel.instagram = "@thestandard";
            return collection.save(hotel).then(() => next());
          } else {
            console.log("Not found hotel");
            return next();
          }
        });
      }
    });
  });
};

exports.down = function(next) {
    next();
};