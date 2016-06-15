'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
  path: `${rootFolder}/.env`
});

const connectionPromise = require('./db');

var emails = [
  'apple@thedipapp.com',
  'curtselak@comcast.net'
];

exports.up = function(next) {
  connectionPromise.then(connection => {
    connection.db.collection('testemails', (error, collection) => {
      if (error) {
        next(error);
      } else {
        emails = emails.map(e => ({email: e}));
        collection.insert(emails, next);
      }
    });
  });
};

exports.down = function(next) {
  connectionPromise.then(connection => {
    connection.db.collection('testemails', (error, collection) => {
      if(error) {
        next(error);
      } else {
        collection.remove({email: {$in: emails}}, next);
      }
    });
  });
};
