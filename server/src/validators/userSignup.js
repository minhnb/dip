'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
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