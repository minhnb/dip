'use strict';

var convertCard = require('./creditCard');

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
        data.dob = user.dob; // ? (user.dob.getFullYear() + "-" + (user.dob.getMonth() + 1) + "-" + user.dob.getDate()) : "";
        data.phone = user.phone;
        data.createdAt = user.createdAt;
        data.balance = user.account.balance;
        data.paymentMethods = user.account.cards.map(convertCard);
        data.defaultCardId = user.account.defaultCardId;
    }
    return data;
}

convertUser.reference = function (user) {
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.firstName + ' ' + user.lastName,
        username: user.username,
        picture: user.avatar
    };
};

module.exports = convertUser;