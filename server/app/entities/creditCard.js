'use strict';

function convertCreditCard(card) {
    return {
        id: card._id,
        stripeToken: card.stripeToken,
        cardType: card.brand,
        last4Digits: card.last4Digits,
        expirationDate: card.expDate
    };
}

module.exports = convertCreditCard;