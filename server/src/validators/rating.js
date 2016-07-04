'use strict';

const validator = require('../helpers/input_validator');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

module.exports = () => validator({
    request: {
        body: {
            rating: r => {
                if (validator.isDecimal()(r).value) {
                    r = parseFloat(r);
                    if (r < 0 || r > 5) {
                        // throw new Error('Rating must be between 0 and 5');
                        throw new DIPError(dipErrorDictionary.INVALID_RATING);
                    }
                } else {
                    // throw new Error('Invalid rating');
                    throw new DIPError(dipErrorDictionary.INVALID_RATING);
                }
            }
        }
    }
});