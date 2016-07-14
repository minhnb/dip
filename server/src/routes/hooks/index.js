"use strict";

const router = require('koa-router')();
const db = require('../../db');
const entities = require('../../entities');
const stripe = require('../../helpers/stripe');

const events = {
	subscriptionCharged: 'invoice.payment_succeeded'
};

module.exports = router;
router
.post('customer subscription created hook', '/subscriptionscreated',
	ctx => {
		let type = ctx.request.body.type,
			eventId = ctx.request.body.id;

		return processEvent(type, eventId).then(() => {
			// Mark the event as processed to prevent further requests
			ctx.status = 200;
		});
	}
);

function processEvent(type, eventId) {
	// Skip unsupported type
	// Return "true" to mark the event as processed so that stripe won't send it again
	if(type != events.subscriptionCharged) return Promise.resolve();

	return getExistingEvent(eventId).then(dbEvent => {
		if (!dbEvent) {
			return processEventSubscriptionCharged(eventId).then(() => saveEvent(eventId));
		} else {
			return Promise.resolve();
		}
	});
}

function processEventSubscriptionCharged(eventId) {
	return stripe.retrieveEvent(eventId).then(response => {
		// valid event
		let eventData = response.data.object,
			customerId = eventData.customer;
		return db.users.findOne({"account.stripeId": customerId})
		.populate('account.subscriptions.type')
		.exec()
		.then(user => {
			if(!user || (user && !user.account.defaultSubscription)) return;
			let subscriptionData = user.account.subscriptions.id(user.account.defaultSubscription);
			if(eventData.subscription != subscriptionData.subscription) return;
			return db.membershipTypes.findOne({planId: subscriptionData.type.planId})
			.exec()
			.then(plan => {
				if(!plan) return;
				var dipCredit = plan.dipCredit;
				return db.users.findByIdAndUpdate(user._id, {$inc: {'account.balance': dipCredit}}).exec();
				// user.account.balance += dipCredit;
				// return user.save();
			});
		});
	});
}

function getExistingEvent(eventId) {
	return db.stripeEvents.findOne({eventId: eventId}).exec()
}

function saveEvent(eventId) {
	let event = new db.stripeEvents({
		eventId: eventId
	});
	return event.save();
}