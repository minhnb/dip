"use strict";

const dipErrorDictionary = require('../constants/dipErrorDictionary');

function DIPError(dipError) {
    for (var key in dipError) {
        this[key] = dipError[key];
    }
    this.name = dipError.code;
    this.message = dipError.details;
    this.expose = true;
    Error.captureStackTrace(this, this.constructor);
}
DIPError.prototype = Object.create(Error.prototype);
DIPError.prototype.constructor = DIPError;
DIPError.responseError = function (error, isProduction, isJSON, isFull) {
    let unknownError = dipErrorDictionary.UNKNOWN_ERROR.code;
    if (isProduction && !error.expose) {
        console.error(error);
        error.code = dipErrorDictionary.BAD_REQUEST.code;
        error.details = dipErrorDictionary.BAD_REQUEST.details;
        error.status = 500;
        isFull = false;
    }
    if (isJSON) {
        if (isFull) {
            return error;
        }
        let response = {
            status: error.status || error.statusCode || 500,
            code: error.code || unknownError,
            details: error.details || error.message
        };
        return response;
    } else {
        return error.code || error.message || unknownError;
    }
};

module.exports = DIPError;