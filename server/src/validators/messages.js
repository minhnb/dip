'use strict';

const validator = require('../helpers/input_validator');

module.exports = {
    addMessage: () => validator({
        request: {
            body: {
                content: validator.isLength({max: 255})
            }
        }
    })
};