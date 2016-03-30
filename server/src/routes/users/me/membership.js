'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const convertMembership = require('../../../entities/membership');

const auth = require('../../../helpers/passport_auth');
const validator = require('../../../helpers/input_validator');
const stripe = require('../../../helpers/stripe');

router.post('add membership', '/',
        auth.authenticate(),
        validator({
            request: {
                body: {
                    type: validator.isMongoId()
                }
            }
        }),
        ctx => {
            let user = ctx.state.user,
                type = ctx.request.body.type,
                defaultSubscription = user.account.defaultSubscription;
                
            if(defaultSubscription) {
                ctx.throw(400, 'need cancel current subscription')
            }
            if(user.account.cards && user.account.cards.length == 0) {
                ctx.throw(400, 'user do not have any credit card')
            }
            
            return db.membershipTypes.findById(type)
            .exec()
            .then(plan => {
                if(!plan) {
                    ctx.throw(404, 'plan not found');
                }
                return stripe.createSubscription(user, plan)
                .then(data => {
                    var subscription = user.account.subscriptions.create({
                        type: plan,
                        customer: data.customer,
                        subscription: data.id
                    });
                    user.account.subscriptions.push(subscription);
                    user.account.defaultSubscription = subscription._id;
                    return user.save().then(() => subscription);
                });
            }).then(subscription => {
                ctx.response.status = 200;
                ctx.response.body = {
                    membership: convertMembership(subscription)
                };
            });
        }
    )
    .delete('cancel membership', '/',
        auth.authenticate(),
        validator({
            request: {
                body: {
                    subscriptionId: validator.isMongoId()
                }
            }
        }),
        ctx => {
            let user = ctx.state.user,
                subscriptionId = ctx.query.body.subscriptionId,
                defaultSubscriptionId = user.account.defaultSubscription;
            if(!defaultSubscriptionId || !defaultSubscriptionId.equals(subscriptionId)) {
                ctx.throw(400, 'invalid membership');
            }
            let subscription = user.account.subscriptions.id(defaultSubscriptionId);

            return db.membershipTypes.findById(subscription.type)
            .exec()
            .then(plan => {
                if(!plan) {
                    ctx.throw(404, 'Plan not found');
                }
                return stripe.cancelSubscription(user, subscription);
            }).then(data => {
                user.account.defaultSubscription = undefined;
                return user.save();
            }).then(user => {
                ctx.response.status = 200;
            });
        }
    );

module.exports = router;