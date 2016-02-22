'use strict';

var validator = require('../helpers/input_validator');

module.exports = function () {
    return validator({
        query: {
            searchKey: validator.optional(),
            limit: validator.optional(validator.isInt()),
            longitude: validator.optional(validator.isDecimal()),
            latitude: validator.optional(validator.isDecimal()),
            minDistance: validator.optional(validator.isDecimal()),
            maxDistance: validator.optional(validator.isDecimal()),
            minRating: validator.optional(validator.isDecimal()),
            maxRating: validator.optional(validator.isDecimal())
        }
    });
};