"use strict";

const moment = require('moment-timezone');

const db = require('../db');
const entities = require('../entities');

const promotionTypes = require('../constants/promotionType');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

var promotionServices = {};

promotionServices.dbGetPromotionByCodeAndHotel = function (code, hotel) {
    return this.dbGetPromotionByCode(code);
};

promotionServices.dbGetPromotionByCode = function (code) {
    let today = moment().format('YYYY-MM-DD');
    let condition = {
        code: code,
        dueDay: {$gte: today},
        startDay: {$lte: today},
        $or: [ {usageLimit: {$lt: 0}}, {$where: "this.usageLimit > this.usageCount"}]
    };

    return db.promotions.findOne(condition).exec().then(promotion => {
        return promotion;
    });
};

promotionServices.addPromotionCode = function (user, promotionCode, hotel) {
    return new Promise((resolve, reject) => {
        this.dbGetPromotionByCodeAndHotel(promotionCode, hotel).then((promotion) => {
            if (!promotion) {
                // ctx.throw(404, 'Invalid code');
                return reject(new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE));
            }
            let result = {
                promotion: entities.promotion(promotion)
            };
            if (promotion.type == promotionTypes.DIP_CREDIT) {
                let added = user.account.promotions.addToSet(promotion);
                if (added.length > 0) {
                    user.account.balance += promotion.amount;
                    return user.save().then(user => {
                        result.user = user;
                        resolve(result);
                    });
                } else {
                    // ctx.throw(400, 'Promotion code already used');
                    reject(new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED));
                }
            } else {
                let substractTotalArray = [promotionTypes.SUBTRACT_TOTAL_PERCENT, promotionTypes.SUBTRACT_TOTAL_AMOUNT];
                if (substractTotalArray.indexOf(promotion.type) > -1) {
                    resolve(result);
                } else {
                    reject(new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE));
                }
            }

        });
    });
};

module.exports = promotionServices;