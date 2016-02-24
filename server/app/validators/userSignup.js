'use strict';

var validator = require('../helpers/input_validator');

module.exports = function () {
    return validator({
        request: {
            body: {
                email: validator.isEmail(),
                password: validator.validatePassword,
                firstName: validator.trim(),
                lastName: validator.trim,
                gender: validator.isIn(['male', 'female', 'na'])
            }
        }
    });
};