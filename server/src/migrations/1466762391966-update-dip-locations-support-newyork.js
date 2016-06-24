'use strict'

const db = require('../db');

let newYorkId = "new_york";
exports.up = function(next) {
    let supportNY = true;
    return updateSupportedDipLocationForCity(newYorkId, supportNY, next);
};

exports.down = function(next) {
    let supportNY = false;
    return updateSupportedDipLocationForCity(newYorkId, supportNY, next);
};

function updateSupportedDipLocationForCity(dipLocationId, supported, next) {
    db.dipLocations.update({"_id": dipLocationId}, {$set: {supported: supported}}, (error, result) => {
        if (error) return next(error);
        if (result.nModified < 1) {
            return next("Not Found New York City");
        }
        return next();
    });
}