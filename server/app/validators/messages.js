'use strict';

var validator = require('../helpers/input_validator');

module.exports = {
    addMessage: function addMessage() {
        return validator({
            request: {
                body: {
                    content: validator.isLength({ max: 255 })
                }
            }
        });
    }
};