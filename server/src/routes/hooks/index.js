"use strict";

const router = require('koa-router')();
const db = require('../../db');
const entities = require('../../entities');

module.exports = router;
router
	.post('customer subscription created hook', '/subscriptionscreated',
	    ctx => {
	        if(ctx.request.body.type != 'customer.subscription.created') return;
	        let customerId = ctx.request.body.data.customer;
	        let data = ctx.request.body.data.object;
	        return db.users.findOne({"account.stripeId": customerId})
	        .exec()
	        .then(user => {
	            if(!user || (user && !user.account.defaultSubscription)) return;
	            let type = user.account.subscriptions.id(user.account.defaultSubscription);
	            if(data.id != type.subscription) return;
	            return db.membershipTypes.findOne({planId: type.subscription})  
	            .exec()
	            .then(plan => {
	                if(!plan) return;
	                var dipCredit = plan.dipCredit;
	                user.account.balance += dipCredit;
	                return user.save();
	            })
	        })
	    }
	)