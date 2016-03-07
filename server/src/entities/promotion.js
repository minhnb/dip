'use strict';

function convertPromotion(promotion) {
    return {
        code: promotion.code,
        amount: promotion.amount
    };
}

module.exports = convertPromotion;