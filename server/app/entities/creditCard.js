'use strict';

function convertCreditCard(card) {
    return {
        stripeToken: card.stripeToken,
        cardType: card.stripeCard.brand,
        lastDigits: card.stripeCard.lastDigits,
        expirationDate: card.stripeCard.expDate,
        address: card.address
    };
}