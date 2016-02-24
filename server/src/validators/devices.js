'use strict';

const validator = require('../helpers/input_validator');

module.exports = {
    addDevice: () => validator({
        request: {
            body: {
                deviceToken: validator.required(true),
                details: validator.optional()
            }
        }
    })
};