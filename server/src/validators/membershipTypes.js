'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
    request: {
        body: {
            name: validator.isLength({max: 255}),
            description: validator.isLength({max: 255}),
            amount: validator.isInt(),
            dipCredit: validator.isInt(),
            interval: validator.isIn(['day', 'week', 'month']),
            intervalCount: validator.isInt()
        }
    }
});