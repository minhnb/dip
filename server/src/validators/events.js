'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
    query: {
        searchKey: validator.optional(),
        limit: validator.optional(validator.isInt()),
        longitude: validator.optional(validator.isDecimal()),
        latitude: validator.optional(validator.isDecimal()),
        minDistance: validator.optional(validator.isDecimal()),
        maxDistance: validator.optional(validator.isDecimal())
    }
});