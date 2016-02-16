'use strict';

const convertCard = require('./creditCard');

function convertUser(user, _private) {
    var data = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        gender: user.gender,
        picture: user.avatar
    };
    if (_private) {
        data.email = user.email;
        data.createdAt = user.createdAt;
        data.balance = user.account.balance;
        data.paymentMethods = user.account.cards.map(convertCard);
    }
}

module.exports = convertUser;