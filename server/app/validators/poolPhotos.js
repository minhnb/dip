'use strict';

var validator = require('../helpers/input_validator');

module.exports = function () {
    return validator({
        query: {
            limit: validator.optional(validator.isInt()),
            offset: validator.optional(validator.isInt())
        }
    });
};