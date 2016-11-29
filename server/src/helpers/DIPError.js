"use strict";

const dipErrorDictionary = require('../constants/dipErrorDictionary');

function DIPError(dipError, extras) {
    for (var key in dipError) {
        this[key] = dipError[key];
    }
    this.name = dipError.code;
    this.message = dipError.details;
    this.expose = true;
    if (extras) {
        this.extras = extras;
    }
    Error.captureStackTrace(this, this.constructor);
}
DIPError.prototype = Object.create(Error.prototype);
DIPError.prototype.constructor = DIPError;
DIPError.responseError = function (error, isProduction, isJSON, isFull) {
    let unknownError = dipErrorDictionary.UNKNOWN_ERROR;
    if (isProduction && !error.expose) {
        console.error(error);
        error.code = unknownError.code;
        error.details = unknownError.details;
        error.status = unknownError.status;
        error.extras = undefined;
        isFull = false;
    }
    if (isJSON) {
        if (isFull) {
            return error;
        }
        let response = {
            status: error.status || error.statusCode || 500,
            code: error.code || unknownError.code,
            details: error.details || error.message
        };
        if (error.hasOwnProperty('extras') && error.extras) {
            response.extras = error.extras;
        }
        return response;
    } else {
        return error.code || error.message || unknownError.code;
    }
};

module.exports = DIPError;