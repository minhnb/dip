'use strict';

const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);

// Place any customization here

function addUser(user) {
    return stripe.customers.create({
        email: user.email
    }).then(customer => {
        user.account.stripeId = customer.id;
        return user.save();
    });
}

function addUserCard(user, token, defaultCard) {
    var p;
    if (!user.account.stripeId) {
        p = addUser(user);
    } else {
        p = Promise.resolve(user);
    }
    return p.then(user => {
        return stripe.customers.createSource(user.account.stripeId, {
            source: token
        }).then(card => {
            if (user.account.cards.some(c => c.fingerprint.equals(card.fingerprint))) {
                // duplicated card
                return stripe.customers.deleteCard(user.account.stripeId, card.id).then(() => {});
            } else {
                var userCard = user.account.cards.create({
                    stripeId: card.id,
                    brand: card.brand,
                    last4Digits: card.last4,
                    expMonth: card.exp_month,
                    expYear: card.exp_year,
                    cvcCheck: card.cvc_check,
                    country: card.country,
                    funding: card.funding,
                    fingerprint: card.fingerprint
                });
                user.account.cards.push(userCard);
                if (defaultCard) {
                    user.account.defaultCardId = userCard._id;
                }
                return user.save().then(() => userCard);
            }
        });
    });
}

function removeUserCard(user, card) {
    return stripe.customers.deleteCard(user.account.stripeId, card.stripeId);
}

function chargeSale(sale) {
    return stripe.charges.create({
        amount: sale.amount,
        currency: 'usd',
        capture: true,
        description: 'Charge on Dip app',
        customer: sale.stripe.customerId,
        source: sale.stripe.cardInfo.stripeId
    });
}

module.exports = {
    stripe: stripe,
    addUser: addUser,
    addUserCard: addUserCard,
    chargeSale: chargeSale
};