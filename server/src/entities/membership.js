'use strict';

function convertMembership(subscription) {
    return subscription ? {
    	id: subscription._id,
        type: (subscription.type && subscription.type._id) ? convertMembershipType(subscription.type) : subscription.type
    } : undefined;
}

function convertMembershipType(membershipType) {
    return {
        id: membershipType._id,
        name: membershipType.name,
        dipCredit: membershipType.dipCredit,
        amount: membershipType.amount,
        interval: membershipType.interval,
        intervalCount: membershipType.intervalCount
    };
}

convertMembership.type = convertMembershipType;

module.exports = convertMembership;