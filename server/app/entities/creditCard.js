'use strict';

function convertCreditCard(card) {
    return {
        id: card._id,
        stripeToken: card.stripeToken,
        cardType: card.stripeCard.brand,
        lastDigits: card.stripeCard.lastDigits,
        expirationDate: card.stripeCard.expDate,
        address: card.address // street, city, state, zip
    };
}

module.exports = convertCreditCard;