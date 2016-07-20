'use strict';

require('dotenv').load({
    path: '../../.env'
});

let config = require('./config');
let db = require('./db');
let stripe = require('./helpers/stripe');

let async = require('asyncawait/async');
let await = require('asyncawait/await');

let endDate = new Date('2016/07/14 13:26:00 GMT+7');

if (config.env !== 'development') {
    console.error('Wrong environment. This should only be run in development server.');
    process.exit(1);
}

let updateUsers = async (users => {
    let updatedUsers = await(users.map(user => {
        user.account.stripeId = null;
        user.account.subscriptions = [];
        user.account.defaultSubscription = null;
        user.cards = [];
        user.account.defaultCardId = null;

        return stripe.addUser(user);
    }));
    console.log(`Updated ${updatedUsers.length} users.`);
    return updatedUsers;
});

db.users.find({createdAt: {$lt: endDate}}).exec()
.then(updateUsers)
.then(users => {
    console.log('Done.');
    process.exit(0);
}, err => {
    console.error('Got error', err.stack || err);
    process.exit(2);
});
