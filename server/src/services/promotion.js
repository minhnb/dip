"use strict";

const moment = require('moment-timezone');

const db = require('../db');
const entities = require('../entities');

const utils = require('../helpers/utils');
const promotionTypes = require('../constants/promotionType');
const promotionTaxTypes = require('../constants/promotionTaxType');

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

promotionServices.checkPromotionCodeIsUnused = function (user, promotion) {
    let added = user.account.promotions.addToSet(promotion);
    if (added.length > 0) {
        return user;
    }
    return false;
};

promotionServices.dbAddPromotionCodeToUser = function (user, promotion) {
    return new Promise((resolve, reject) => {
        let user = this.checkPromotionCodeIsUnused(user, promotion);
        if (user) {
            if (promotion.type == promotionTypes.DIP_CREDIT) {
                user.account.balance += promotion.amount;
            }
            return user.save().then(user => {
                resolve(user);
            });
        } else {
            reject();
        }
    });
};

promotionServices.checkValidPromotionCode = function (promotion, userCondition) {
    let condition = promotion.condition.toObject();
    for (var key in condition) {
        if (condition[key].length > 0) {
            if (!userCondition[key] || userCondition[key].length == 0 || !this.satisfyOneCondition(condition[key], userCondition[key])) {
                return false;
            }
        }
    }
    return true;
};

promotionServices.satisfyOneCondition = function (conditionArray, userConditionArray) {
    return utils.hasDuplicateElement(conditionArray, userConditionArray);
};

promotionServices.buildUserCondition = function (hotelId, listOfferIds, eventId) {
    return new Promise((resolve, reject) => {
        let condition = {
            hotels: [],
            hotelServices: [],
            serviceTypes: [],
            offers: [],
            amenityTypes: [],
            events: []
        };
        if (listOfferIds) {
            db.offers
                .find({_id: {$in: listOfferIds}})
                .populate(['service', 'hotel']).exec().then((listOffers) => {
                if (listOffers.length != listOfferIds.length) {
                    return reject();
                }
                listOffers.forEach(offer => {
                    condition = promotionServices.makeOfferCondition(offer, condition);
                });
                resolve(condition);
            });
        } else if (eventId) {
            db.events
                .findById(eventId)
                .populate(['host', 'hotel']).exec().then((event) => {
                if (!event) {
                    reject();
                }
                condition = promotionServices.makeEventCondition(event, condition);
                resolve(condition);
            });
        } else if (hotelId) {
            condition.hotels = [hotelId];
            resolve(condition);
        } else {
            resolve(condition);
        }
    });
};

promotionServices.makeOfferCondition = function(offer, condition) {
    condition.offers.push(offer._id);

    if (offer.amenities && offer.amenities.length > 0) {
        offer.amenities.forEach(amenityType => {
            if (condition.amenityTypes.indexOf(amenityType) == -1) {
                condition.amenityTypes.push(amenityType);
            }
        });
    }

    if (condition.hotels.indexOf(offer.hotel._id) == -1) {
        condition.hotels.push(offer.hotel._id);
    }
    if (condition.hotelServices.indexOf(offer.service._id) == -1) {
        condition.hotelServices.push(offer.service._id);

        if (condition.serviceTypes.indexOf(offer.service.type) == -1) {
            condition.serviceTypes.push(offer.service.type);
        }
    }
    return condition;
};

promotionServices.makeEventCondition = function(event, condition) {
    condition.events.push(event._id);

    if (condition.hotels.indexOf(event.hotel._id) == -1) {
        condition.hotels.push(event.hotel._id);
    }
    if (condition.hotelServices.indexOf(event.host._id) == -1) {
        condition.hotelServices.push(event.host._id);

        if (condition.serviceTypes.indexOf(event.host.type) == -1) {
            condition.serviceTypes.push(event.host.type);
        }
    }
    return condition;
};

promotionServices.isPromotionOffer = function (promotion, userOffer) {
    let condition = {
        hotels: [],
        hotelServices: [],
        serviceTypes: [],
        offers: [],
        amenityTypes: [],
        events: []
    };
    condition = promotionServices.makeOfferCondition(userOffer.data, condition);
    return promotionServices.checkValidPromotionCode(promotion, condition);
};

promotionServices.calculatePromotionPortionForOffer = function (promotion, listUserOffer) {
    let promotionPortion = 0;
    listUserOffer.forEach(userOffer => {
        if (promotionServices.isPromotionOffer(promotion, userOffer)) {
            promotionPortion += userOffer.count * userOffer.price;
        }
    });
    return promotionPortion;
};

promotionServices.calculatePromotionDiscountForOffer = function (promotion, listUserOffer, taxPercent) {
    let promotionPortion = promotionServices.calculatePromotionPortionForOffer(promotion, listUserOffer);
    return promotionServices.calculatePromotionDiscount(promotion, promotionPortion, taxPercent);
};

promotionServices.calculatePromotionDiscount = function (promotion, promotionPortion, taxPercent) {
    let promotionDiscount = 0;
    switch (promotion.type) {
        case promotionTypes.SUBTRACT_TOTAL_AMOUNT:
            let maxDiscountPromo = promotion.amount;
            if (promotion.taxType == promotionTaxTypes.BEFORE_TAX) {
                promotionDiscount = maxDiscountPromo > promotionPortion ? promotionPortion : maxDiscountPromo;
            } else {
                let promotionPortionIncludeTax = promotionPortion + Math.round(taxPercent * promotionPortion / 100);
                promotionDiscount = maxDiscountPromo > promotionPortionIncludeTax ? promotionPortionIncludeTax : maxDiscountPromo;
            }
            break;
        case promotionTypes.SUBTRACT_TOTAL_PERCENT:
            let promotionPercent = promotion.amount;
            promotionDiscount = Math.round(promotionPercent * promotionPortion / 100);
            break;
        default:
    }

    let result = promotion;
    result.discount = promotionDiscount;
    return result;
};

promotionServices.getPromotionCode = function (user, promotionCode, needAddingDipCreditPromotionCode, hotel, offers, event) {
    return new Promise((resolve, reject) => {
        this.dbGetPromotionByCodeAndHotel(promotionCode, hotel).then((promotion) => {
            if (!promotion) {
                // ctx.throw(404, 'Invalid code');
                return reject(new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE));
            }
            let result = entities.promotion(promotion);
            if (promotion.type == promotionTypes.DIP_CREDIT) {
                let checkUser = this.checkPromotionCodeIsUnused(user, promotion);
                if (checkUser) {
                    if (needAddingDipCreditPromotionCode) {
                        if (promotion.type == promotionTypes.DIP_CREDIT) {
                            checkUser.account.balance += promotion.amount;
                        }
                        return user.save().then(user => {
                            resolve(result);
                        });
                    } else {
                        resolve(result);
                    }
                } else {
                    reject(new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED));
                }
            } else {
                let checkUser = this.checkPromotionCodeIsUnused(user, promotion);
                if (checkUser) {
                    let substractTotalArray = [promotionTypes.SUBTRACT_TOTAL_PERCENT, promotionTypes.SUBTRACT_TOTAL_AMOUNT];
                    if (substractTotalArray.indexOf(promotion.type) > -1) {
                        this.buildUserCondition(hotel, offers, event).then(userCondition => {
                            if (this.checkValidPromotionCode(promotion, userCondition)) {
                                resolve(result);
                            } else{
                                reject(new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE));
                            }
                        }, () => {
                            if (event) {
                                reject(new DIPError(dipErrorDictionary.EVENT_NOT_FOUND));
                            } else {
                                reject(new DIPError(dipErrorDictionary.INVALID_OFFER_ID));
                            }
                        });
                    } else {
                        reject(new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE));
                    }
                } else {
                    // ctx.throw(400, 'Promotion code already used');
                    reject(new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED));
                }
            }

        });
    });
};

promotionServices.addPromotionCode = function (user, promotionCode, hotel, offers, event) {
    let needAddingDipCreditPromotionCode = true;
    return promotionServices.getPromotionCode(user, promotionCode, needAddingDipCreditPromotionCode, hotel, offers, event);
};

module.exports = promotionServices;