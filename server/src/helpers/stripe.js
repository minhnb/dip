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
            if (user.account.cards.some(c => c.fingerprint === card.fingerprint)) {
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

function setDefaultUserCard(user, card) {
    return stripe.customers.update(user.account.stripeId, {default_source: card.stripeId});
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

function createSubscription(user, plan) {
    return stripe.customers.createSubscription(
        user.account.stripeId, 
        {
            plan: plan.planId
        })
    .then(data => {
        var subscription = user.account.subscriptions.create({
            type: plan._id,
            customer: data.customer,
            subscription: data.id
        });
        user.account.subscriptions.push(subscription);
        user.account.defaultSubscription = subscription._id;
        return user.save().then(() => user.account);
    })
}

function cancelSubscription(user, currentSubscription) {
    return stripe.customers.cancelSubscription(
        user.account.stripeId,
        currentSubscription.subscription)
    .then(data => {
        user.account.defaultSubscription = undefined;
        return user.save().then(user => user.account);
    })
}

function createPlan(plan) {
    return stripe.plans.create(plan)
    .then(plan => plan)
}

function updatePlan(planId, name) {
    return stripe.plans.update(planId, {
      name: name
    })
    .then(plan => plan)
}

module.exports = {
    stripe: stripe,
    addUser: addUser,
    addUserCard: addUserCard,
    createSubscription: createSubscription,
    chargeSale: chargeSale,
    cancelSubscription: cancelSubscription,
    createPlan: createPlan,
    updatePlan: updatePlan,
    setDefaultUserCard: setDefaultUserCard
};