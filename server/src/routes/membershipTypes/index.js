"use strict";

const router = require('koa-router')();

const db = require('../../db');

const auth = require('../../helpers/passport_auth');
const inputValidator = require('../../validators');
const validator = require('../../helpers/input_validator');
const config = require('../../config');
const stripe = require('../../helpers/stripe');
const utils = require('../../helpers/utils');


module.exports = router;

router.use('/', auth.authenticate())
	.post('add membership type', '/',
        utils.isAdmin,
		inputValidator.membershipTypes(),
		ctx => {

			let name = ctx.request.body.name,
				description = ctx.request.body.description || '',
				amount = ctx.request.body.amount,
				interval = ctx.request.body.interval,
				intervalCount = ctx.request.body.intervalCount,
                planId = ctx.request.body.planId || name.split(' ').join('_').toLowerCase();

            let plan = {
                amount: amount,
                interval: interval,
                name: name,
                currency: 'usd',
                id: planId
            }
            return stripe.createPlan(plan)
                .then(data => {
                    let membershipType = new db.membershipTypes({
                        name: data.name,
                        description: description,
                        amount: data.amount,
                        interval: data.interval,
                        intervalCount: data.interval_count,
                        planId: data.id
                    });
                    return membershipType.save().then(() => {
                        ctx.status = 200
                    })  
                })		
		}		
	)
	.get('/',
        inputValidator.limitParams(),
        ctx => {
            let limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20,
                offset = ctx.query.offset ? parseInt(ctx.query.offset) : 0;

            return db.membershipTypes.find()
                .sort({createdAt: -1})
                .limit(limit)
                .skip(offset)
                .exec()
                .then(types => {
                	ctx.status = 200;
                    ctx.body = types;
                });
        }	
    )
	.put('/',
        utils.isAdmin,
        validator({
            request: {
                body: {
                	typeId: validator.isMongoId(),
                	amount: validator.optional(validator.isInt()),
                	interval: validator.optional(validator.isIn(['day', 'week', 'month'])),
                	intervalCount: validator.optional(validator.isInt())
                }
            }
        }),
        ctx => {

            return db.membershipTypes.findOne({_id: ctx.request.body.typeId})
            	.exec()
            	.then(type => {
            		if(type) {
                        let planId = type.planId;
                        let msType = ctx.request.body;
                        if(msType.name !== undefined) {
                            type.name = msType.name
                        }
                        if(msType.description !== undefined) {
                            type.description = msType.description
                        }
                        //Updates the name of a plan. Other plan details (price, interval, etc.) are, by design, not editable.
                        return stripe.updatePlan(planId, name)
                        .then(() => {
                            return type.save().then(() => {
                                ctx.status = 200;
                            })
                        })
            		}else {
            			ctx.throw(404, 'membership type not found');
            		}
            	})
        }	
    )

module.exports = router;