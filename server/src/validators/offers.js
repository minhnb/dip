'use strict';

const validator = require('../helpers/input_validator');

module.exports = (dateRequired) => validator({
    query: {
        date: dateRequired ? validator.isDate() : validator.optional(validator.isDate()),
        //minPrice: validator.optional(validator.isDecimal()),
        //maxPrice: validator.optional(validator.isDecimal()),
        //startTime: validator.optional(validator.isInt()),
        //endTime: validator.optional(validator.isInt())
    }
});