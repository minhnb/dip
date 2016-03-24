'use strict';

function convertMembership(subscription, defaultSubscription) {
	let subscriptionMap = subscription.reduce((obj, subscription) => {
        obj[subscription.id] = subscription;
        return obj;
    }, Object.create({}));

    return {
        type: subscriptionMap[defaultSubscription].type
    }
}

module.exports = convertMembership;