'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
    query: {
        longitude: validator.optional(validator.isDecimal()),
        latitude: validator.optional(validator.isDecimal()),
    }
});