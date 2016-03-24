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
                    return stripe.createSubscription(user, plan).then(data => {
                        if(!data) {
                            ctx.throw(400, 'stripe error');
                        }
                        ctx.response.status = 200;
                        ctx.response.body = {
                            membership: convertMembership(data.subscriptions, data.defaultSubscription)
                        }
                    })
                })
        }
    )
    .post('cancel membership', '/:subscriptionId/cancel',
        auth.authenticate(),
        validator({
            params: {
                subscriptionId: validator.isMongoId()
            }
        }),
        ctx => {
            let user = ctx.state.user;
            let subscriptionId = ctx.params.subscriptionId;
            let subscriptionMap = user.account.subscriptions.reduce((obj, subscription) => {
                obj[subscription.id] = subscription;
                return obj;
            }, Object.create({}));
            if(!subscriptionMap[subscriptionId]) {
                throw(400, 'invalid membership')
            }
            return db.membershipTypes.findById(subscriptionMap[subscriptionId].type)
            .exec()
            .then(plan => {
                if(!plan) {
                    ctx.throw(404, 'Plan not found');
                }
                return stripe.cancelSubscription(user, subscriptionMap[subscriptionId]).then(subscription => {
                    if(!subscription) {
                        ctx.throw(400, 'stripe error');
                    }
                    ctx.response.status = 200;
                })
            })

        }
    )


module.exports = router;