'use strict';

const validator = require('../helpers/input_validator');

module.exports = () => validator({
    request: {
        body: {
            rating: r => {
                if (validator.isDecimal()(r)) {
                    r = parseFloat(r);
                    if (r < 0 || r > 5) throw new Error('Rating must be between 0 and 5');
                } else {
                    throw new Error('Invalid rating');
                }
            }
        }
    }
});