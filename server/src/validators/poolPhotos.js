'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
    query: {
        limit: validator.optional(validator.isInt()),
        offset: validator.optional(validator.isInt())
    }
});