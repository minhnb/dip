'use strict';

function convertCreditCard(card, defaultId) {
    return {
        id: card._id,
        cardType: card.brand,
        last4Digits: card.last4Digits,
        expirationDate: card.expDate,
        cvcCheck: card.cvcCheck,
        default: card._id.equals(defaultId)
    }
}

module.exports = convertCreditCard;