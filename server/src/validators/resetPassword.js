'use strict';

const validator = require('../helpers/input_validator');

module.exports = {
    request: () => validator({
        request: {
            body: {
                email: validator.isEmail()
            }
        }
    }),
    reset: () => validator({
        request: {
            body: {
                password: validator.validatePassword
            }
        }
    })
};