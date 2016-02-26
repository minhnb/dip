'use strict';

const validator = require('../helpers/input_validator');

module.exports = {
    addReservation: () => validator({
        request: {
            body: {
                pool: validator.isMongoId(),
                offers: offers => {
                    if (!offers || !Array.isArray(offers) || offers.length == 0) {
                        throw new Error('Offer is required');
                    }
                    offers.forEach(o => {
                        if (!o.id || !o.count || !o.price) {
                            throw new Error('Missing offer field');
                        }
                        if (!validator.isInt()(o.count).value || !validator.isDecimal()(o.price).value) {
                            throw new Error('Invalid offer field');
                        }
                        o.count = parseInt(o.count);
                        o.price = parseFloat(o.price);
                        if (o.count <= 0) {
                            throw new Error('Invalid offer count');
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