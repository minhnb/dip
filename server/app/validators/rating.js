'use strict';

var validator = require('../helpers/input_validator');

module.exports = function () {
    return validator({
        request: {
            body: {
                rating: function rating(r) {
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
};