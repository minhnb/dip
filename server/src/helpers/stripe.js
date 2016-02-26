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
            var userCard = user.account.cards.create({
                stripeToken: token,
                brand: card.brand,
                last4Digits: card.last4,
                expMonth: card.exp_month,
                expYear: card.exp_year,
                cvcCheck: card.cvc_check,
                country: card.country,
                funding: card.funding
            });
            user.account.cards.push(userCard);
            if (defaultCard) {
                user.account.defaultCardId = userCard._id;
            }
            return user.save().then(() => userCard);
        });
    });
}

function chargeSale(sale) {
    return stripe.charges.create({
        amount: sale.amount,
        currency: 'usd',
        capture: true,
        description: 'Charge on Dip app',
        customer: sale.stripe.customerId,
        source: sale.stripe.cardInfo.stripeToken
    });
}

module.exports = {
    stripe: stripe,
    addUser: addUser,
    addUserCard: addUserCard,
    chargeSale: chargeSale
};