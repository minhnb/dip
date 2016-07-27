'use strict';

const convertMembership = require('./membership');
const utils = require('../helpers/utils');

function convertUser(user) {
    if (!user) {
        return null;
    }

    let facebookGraphAPI = 'https://graph.facebook.com/';
    if(user.avatar.provider == 'facebook' && user.facebookId) {
        user.avatar.url = facebookGraphAPI + user.facebookId + '/picture?width=300&height=300';

    }

    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: utils.getFullName([user.firstName, user.lastName], " "),
        username: user.username,
        dob: user.dob,
        picture: user.avatar,
        phone: user.phone,
        balance: user.balance,
        membership: user.account.defaultSubscription ? convertMembership(user.account.subscriptions.id(user.account.defaultSubscription)) : undefined,
        refCode: user.account.refCode,
        createdAt: user.createdAt.getTime()
    };
}

module.exports = convertUser;