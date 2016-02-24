'use strict';

var validator = require('../helpers/input_validator');

module.exports = {
    request: function request() {
        return validator({
            request: {
                body: {
                    email: validator.isEmail()
                }
            }
        });
    },
    reset: function reset() {
        return validator({
            request: {
                body: {
                    password: validator.validatePassword
                }
            }
        });
    }
};