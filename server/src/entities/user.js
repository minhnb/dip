'use strict';

const convertCard = require('./creditCard');

function convertUser(user, currentUser) {
    var data = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        gender: user.gender,
        picture: user.avatar,
        // leave isFriend empty if no currentUser passed in
        isFriend: currentUser ? currentUser.friends.some(f => f.equals(user._id)) : undefined
    };
    if (currentUser && currentUser._id.equals(user._id)) {
        data.email = user.email;
        data.dob = user.dob; // ? (user.dob.getFullYear() + "-" + (user.dob.getMonth() + 1) + "-" + user.dob.getDate()) : "";
        data.phone = user.phone;
        data.createdAt = user.createdAt;
        data.balance = user.account.balance;
        data.paymentMethods = user.account.cards.map(convertCard);
        data.defaultCardId = user.account.defaultCardId;
        data.private = user.privateMode;
    }
    return data;
}

convertUser.reference = function(user) {
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        username: user.username,
        picture: user.avatar
    };
};

module.exports = convertUser;