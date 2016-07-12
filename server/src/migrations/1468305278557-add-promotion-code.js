'use strict'

const connectionPromise = require('./db');

let listPromotion = [{
    "code" : "dipla16",
    "amount" : 2000,
    "type" : "DIP_CREDIT",
    "taxType" : "AFTER_TAX",
    "usageLimit" : -1,
    "usageCount" : 0,
    "startDay" : "2016-07-08",
    "dueDay" : "9999-07-09"
  },
  {
    "code" : "bestbuds",
    "amount" : 8000,
    "type" : "SUBTRACT_TOTAL_AMOUNT",
    "taxType" : "AFTER_TAX",
    "usageLimit" : -1,
    "usageCount" : 0,
    "startDay" : "2016-07-08",
    "dueDay" : "9999-07-09",
    "condition" : {
      "amenityTypes" : [
        "cabana"
      ]
    }
  }];

exports.up = function(next) {
  connectionPromise.then(connection => {
    connection.db.collection('promotions', (error, collection) => {
      collection.insert(listPromotion, (error, results) => {
        if (error) {
          return next(error);
        }
        next();
      });
    });
  });
};

exports.down = function(next) {
  next();
};
