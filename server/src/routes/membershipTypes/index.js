"use strict";

const router = require('koa-router')();

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../auth');
const inputValidator = require('../../validators');
const validator = require('../../helpers/input_validator');
const config = require('../../config');
const stripe = require('../../helpers/stripe');
const utils = require('../../helpers/utils');

const dipErrorDictionary = require('../../constants/dipErrorDictionary');
const DIPError = require('../../helpers/DIPError');

module.exports = router;

router.use('/', auth.authenticate())
	.post('add membership type', '/',
        utils.isAdmin,
		inputValidator.membershipTypes(),
		ctx => {
			let name = ctx.request.body.name,
				dipCredit = ctx.request.body.dipCredit,
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
            };
            return stripe.createPlan(plan)
            .then(data => {
                let membershipType = new db.membershipTypes({
                    name: data.name,
                    dipCredit: dipCredit,
                    amount: data.amount,
                    interval: data.interval,
                    intervalCount: data.interval_count,
                    planId: data.id
                });
                return membershipType.save();
            }).then(() => {
                ctx.status = 200
            });
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
                    ctx.body = types.map(entities.membership.type);
                });
        }
    )
	.put('/:typeId',
        utils.isAdmin,
        validator({
            params: {
                typeId: validator.isMongoId()
            }
        }),
        ctx => {
            let typeId = ctx.params.typeId
            return db.membershipTypes.findOne({_id: typeId})
            	.exec()
            	.then(type => {
            		if (type) {
                        let planId = type.planId;
                        if(ctx.request.body.name) {
                            type.name = ctx.request.body.name
                        }

                        //Updates the name of a plan. Other plan details (price, interval, etc.) are, by design, not editable.
                        return stripe.updatePlan(planId, ctx.request.body.name)
                        .then(() => {
                            return type.save().then(() => {
                                ctx.status = 200;
                            })
                        });
            		} else {
            			// ctx.throw(404, 'membership type not found');
                        throw new DIPError(dipErrorDictionary.MEMBERSHIP_TYPE_NOT_FOUND);
            		}
            	});
        }
    );

module.exports = router;