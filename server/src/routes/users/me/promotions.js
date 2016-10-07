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
            hotel = ctx.request.body.hotel,
            offers = ctx.request.body.offers,
            event = ctx.request.body.event;

        if (promotionCode) {
            promotionCode = promotionCode.toLowerCase();
        }

        return promotionServices.addPromotionCode(user, promotionCode, hotel, offers, event).then((promotion) => {
            ctx.body = promotion;
        });
    }
);