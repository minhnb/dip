'use strict';

const validator = require('../helpers/input_validator');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

module.exports = {
    addReservation: () => validator({
        request: {
            body: {
                pool: validator.isMongoId(),
                offers: offers => {
                    if (!offers || !Array.isArray(offers) || offers.length == 0) {
                        // throw new Error('Offer is required');
                        throw new DIPError(dipErrorDictionary.OFFER_IS_REQUIRED);
                    }
                    offers.forEach(o => {
                        if (!o.id || !o.count || !o.price) {
                            // throw new Error('Missing offer field');
                            throw new DIPError(dipErrorDictionary.MISSING_OFFER_FIELD);
                        }
                        if (!validator.isInt()(o.count).value || !validator.isDecimal()(o.price).value) {
                            // throw new Error('Invalid offer field');
                            throw new DIPError(dipErrorDictionary.INVALID_OFFER_FIELD);
                        }
                        o.count = parseInt(o.count);
                        o.price = parseFloat(o.price);
                        if (o.count <= 0) {
                            // throw new Error('Invalid offer count');
                            throw new DIPError(dipErrorDictionary.INVALID_OFFER_COUNT);
                        }
                    });
                    return true;
                },
                cardId: validator.required(true),
                price: validator.isDecimal()
            }
        }
    })
};