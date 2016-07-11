'use strict';

function convertPromotion(promotion) {
    if (!promotion) {
        return null;
    }
    return {
        code: promotion.code,
        amount: promotion.amount,
        type: promotion.type,
        taxType: promotion.taxType,
        condition: promotion.condition
    };
}

module.exports = convertPromotion;