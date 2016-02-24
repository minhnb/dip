'use strict';

var validator = require('../helpers/input_validator');

module.exports = {
    addDevice: function addDevice() {
        return validator({
            request: {
                body: {
                    deviceToken: validator.required(true),
                    details: validator.optional()
                }
            }
        });
    }
};