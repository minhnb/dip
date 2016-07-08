'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');

const promotionServices = require('../../../services/promotion');

const dipErrorDictionary = require('../../../constants/dipErrorDictionary');
const DIPError = require('../../../helpers/DIPError');

module.exports = router;

router.put('add promotion', '/:promotionCode',
    ctx => {
        let promotionCode = ctx.params.promotionCode,
            user = ctx.state.user,
            hotel = ctx.request.body.hotel;

        return promotionServices.addPromotionCode(user, promotionCode, hotel).then((result) => {
            ctx.body = result.promotion;
            if (result.user) {
                ctx.state.user = result.user;
            }
        });
    }
);