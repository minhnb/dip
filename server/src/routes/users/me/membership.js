'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const convertMembership = require('../../../entities/membership');

const auth = require('../../../helpers/passport_auth');
const validator = require('../../../helpers/input_validator');
const stripe = require('../../../helpers/stripe');

const dipErrorDictionary = require('../../../constants/dipErrorDictionary');
const DIPError = require('../../../helpers/DIPError');

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
                // ctx.throw(400, 'need cancel current subscription')
                throw new DIPError(dipErrorDictionary.NEED_CANCEL_CURRENT_SUBSCRIPTION);
            }
            if(user.account.cards && user.account.cards.length == 0) {
                // ctx.throw(400, 'user do not have any credit card')
                throw new DIPError(dipErrorDictionary.NO_CREDIT_CARD);
            }
            
            return db.membershipTypes.findById(type)
            .exec()
            .then(plan => {
                if(!plan) {
                    // ctx.throw(404, 'plan not found');
                    throw new DIPError(dipErrorDictionary.PLAN_NOT_FOUND);
                }
                return stripe.createSubscription(user, plan)
                .then(data => {
                    var subscription = user.account.subscriptions.create({
                        type: plan,
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
        ctx => {
            let user = ctx.state.user,
                defaultSubscriptionId = user.account.defaultSubscription;
            if(!defaultSubscriptionId) {
                // ctx.throw(400, 'invalid membership');
                throw new DIPError(dipErrorDictionary.INVALID_MEMBERSHIP);
            }
            let subscription = user.account.subscriptions.id(defaultSubscriptionId);

            return db.membershipTypes.findById(subscription.type)
            .exec()
            .then(plan => {
                if(!plan) {
                    // ctx.throw(404, 'Plan not found');
                    throw new DIPError(dipErrorDictionary.PLAN_NOT_FOUND);
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