'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');

module.exports = router;

router.put('add promotion', '/:promotionCode',
    ctx => {
        let promotionCode = ctx.params.promotionCode,
            user = ctx.state.user;

        return db.promotions.findOne({code: promotionCode}).then(promotion => {
            if (!promotion) {
                ctx.throw(404, 'Invalid code');
            }
            let added = user.account.promotions.addToSet(promotion);
            if (added.length > 0) {
                // promotion not in list yet
                user.account.balance += promotion.amount;
                return user.save().then(user => {
                    ctx.status = 200;
                    ctx.body = {
                        promotion: entities.promotion(promotion),
                        balance: user.account.balance
                    };
                });
            } else {
                ctx.throw(400, 'Promotion code already used');
            }
        });
    }
);