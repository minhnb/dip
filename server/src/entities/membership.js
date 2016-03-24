'use strict';

function convertMembership(subscription, defaultSubscription) {
	let subscriptionMap = subscription.reduce((obj, subscription) => {
        obj[subscription.id] = subscription;
        return obj;
    }, Object.create({}));

    return {
    	id: subscriptionMap[defaultSubscription]._id,
        type: subscriptionMap[defaultSubscription].type
    }
}

module.exports = convertMembership;