"use strict";

const moment = require('moment-timezone');

const db = require('../db');
const entities = require('../entities');

const utils = require('../helpers/utils');
const promotionTypes = require('../constants/promotionType');
const promotionTaxTypes = require('../constants/promotionTaxType');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const mailer = require('../mailer');
const stripe = require('../helpers/stripe');
const config = require('../config');

const compose = require('koa-compose');
const promotionServices = require('./promotion');

const maker = require('../helpers/iftttMakerEvent');

var reservationServices = {};

reservationServices.dbGetReservation = function (condition, needUserRef) {
    if (!condition) {
        condition = {};
    }
    let query;
    let populate = [];
    if (needUserRef) {
        populate.push({
            path: 'user.ref',
            model: db.users
        });
    }
    if (!condition.type) {
        if (populate.length > 0) {
            return db.reservations
                .find(condition)
                .populate(populate)
                .exec();
        } else {
            return db.reservations
                .find(condition)
                .exec();
        }
    }

    switch (condition.type) {
        case 'HotelReservation':
            populate.push({
                path: 'hotel.ref',
                model: db.hotels
            });
            populate.push({
                path: 'services',
                model: db.hotelSubReservations,
                populate: [
                    {
                        path: 'offers.ref',
                        model: db.offers
                    },
                    {
                        path: 'offers.addons.ref',
                        model: db.addons
                    }
                ]
            });
            return db.hotelReservations
                .find(condition)
                .populate(populate)
                .exec();

        case 'EventReservation':
            populate.push({
                path: 'event.ref',
                model: db.events,
                populate: [
                    {
                        path: 'host',
                        model: db.hotelServices
                    },
                    {
                        path: 'hotel',
                        model: db.hotels
                    }
                ]
            });
            return db.reservations
                .find(condition)
                .populate(populate)
                .exec();

        case 'SpecialOfferReservation':
            populate.push({
                path: 'specialOffer.ref',
                model: db.specialOffers
            });
            populate.push({
                path: 'offers.ref',
                model: db.offers
            });
            populate.push({
                path: 'offers.service',
                model: db.hotelServices
            });
            return db.reservations
                .find(condition)
                .populate(populate)
                .exec();
    }
};

reservationServices.dbGetHotel = function (hotelId) {
    return db.hotels.findOne({_id: hotelId})
        .exec()
        .then(hotel => {
            if(!hotel) {
                // ctx.throw(400, 'Invalid hotel');
                throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
            }
            return hotel;
        });
};

reservationServices.getHotelReservation = function (user) {
    let condition = {'user.ref': user, type: 'HotelReservation'};
    return reservationServices.dbGetReservation(condition).then(reservations => {
        return reservations.map(entities.hotelReservation);
    });
};

reservationServices.isValidObjectId = function (objectId, listValidObjects) {
    for (let i = 0; i < listValidObjects.length; i++) {
        let validService = listValidObjects[i];
        if (validService && validService._id && validService._id == objectId) {
            return true;
        }
    }
    return false;
};

reservationServices.checkValidOffer = function (userOffer, baseOffer) {
    if (!userOffer) {
        // ctx.throw(400, 'Invalid offer id');
        throw new DIPError(dipErrorDictionary.INVALID_OFFER_ID);
    }

    if (userOffer.service != baseOffer.service) {
        // ctx.throw(400, 'Invalid offer id');
        throw new DIPError(dipErrorDictionary.INVALID_OFFER_ID);
    }

    if(!userOffer.date) {
        // ctx.throw(400, 'Missing offer date');
        throw new DIPError(dipErrorDictionary.MISSING_OFFER_DATE);
    }

    if(!userOffer.count) {
        // ctx.throw(400, 'Missing quantities');
        throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
    }
    if(userOffer.count < 0) {
        // ctx.throw(400, 'quantities must be large then zero');
        throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
    }

    if (userOffer.price != baseOffer.price) {
        // ctx.throw(400, 'Unmatched offer price');
        throw new DIPError(dipErrorDictionary.UNMATCHED_OFFER_PRICE);
    }

    let startDay = moment().weekday(),
        startDate = moment().weekday(startDay).format('YYYY-MM-DD'),
        maxDaysReservation = moment(startDate).add(14, 'days').format('YYYY-MM-DD'),
        reserveDay = moment(userOffer.date).weekday(),
        reserveDate = moment(userOffer.date).format('YYYY-MM-DD'),
        offerTime = moment.tz(reserveDate, baseOffer.hotel.address.timezone).add(moment.duration(baseOffer.duration.startTime/60, 'hours'));

    // New rule: disable offers that has less than 1 hour to endTime
    let lastAllowTime = moment.tz(reserveDate, baseOffer.hotel.address.timezone).add(moment.duration(baseOffer.duration.endTime/60 - 1, 'hours'));
    let now = moment().tz(baseOffer.hotel.address.timezone);

    if(baseOffer.days.indexOf(reserveDay) == -1 ||
        ((offerTime < now) && (lastAllowTime < now)) ||
        moment(reserveDate) > moment(maxDaysReservation) ||
        (baseOffer.dueDay && moment(baseOffer.dueDay) < moment(reserveDate)) ||
        moment(baseOffer.startDay) > moment(reserveDate) ||
        (baseOffer.offDays.indexOf(reserveDate) > -1)) {
        // ctx.throw(400, 'Not serve');
        throw new DIPError(dipErrorDictionary.OFFER_NOT_SERVE);
    }

    let reservationCount = 0;
    let pendingReservationCount = 0;
    if (baseOffer.reservationCount && baseOffer.reservationCount[reserveDate]) {
        reservationCount = baseOffer.reservationCount[reserveDate];
    }

    if (baseOffer.pendingReservationCount && baseOffer.pendingReservationCount[reserveDate]) {
        pendingReservationCount = baseOffer.pendingReservationCount[reserveDate];
    }

    if(reservationCount + pendingReservationCount + userOffer.count > baseOffer.allotmentCount)
    {
        // ctx.throw(400, 'Over booking');
        throw new DIPError(dipErrorDictionary.OFFER_OVERBOOKING);
    }
};

reservationServices.increaseOfferCount = function(offer, reserveDate, count) {
    if (offer.reservationCount == undefined) {
        offer.reservationCount = {};
    }
    offer.reservationCount[reserveDate] ?
        offer.reservationCount[reserveDate] += count :
        offer.reservationCount[reserveDate] = count;
    offer.markModified('reservationCount');
    return offer;
};

reservationServices.checkUserCardInput = function(ctx, next) {
    let user = ctx.state.user,
        userCardId = ctx.request.body.cardId;

    let userCard = user.account.cards.id(userCardId);
    if (!userCard) {
        // ctx.throw(400, 'Invalid card id');
        throw new DIPError(dipErrorDictionary.INVALID_CARD_ID);
    }
    if (!userCard.passCvc) {
        // ctx.throw(400, 'Cvc checking failed');
        throw new DIPError(dipErrorDictionary.CVC_CHECKING_FAILED);
    }

    ctx.state.userCard = userCard;
    return next();
};

reservationServices.initCtxState = function(ctx, next) {
    ctx.state.beforeTax = 0;
    return next();
};


reservationServices.checkHotelReservationInput = compose([
    function(ctx, next) {
        if(!ctx.request.body.services) {
            // ctx.throw(400, 'Invalid services');
            throw new DIPError(dipErrorDictionary.INVALID_SERVICES);
        }
        if(!ctx.request.body.hotel) {
            // ctx.throw(400, 'Missing hotel id');
            throw new DIPError(dipErrorDictionary.MISSING_HOTEL_ID);
        }
        if(!Array.isArray(ctx.request.body.services)) {
            // ctx.throw(400, 'Services must be an array');
            throw new DIPError(dipErrorDictionary.SERVICES_MUST_BE_AN_ARRAY);
        }

        ctx.state.serviceIds = ctx.request.body.services.map(service => service.id);
        return next();
    },
    reservationServices.checkUserCardInput,
    reservationServices.initCtxState
]);

reservationServices.verifyHotelServicesAndOffers = function(ctx, next) {
    return db.hotels.findOne({_id: ctx.request.body.hotel})
        .populate('services')
        .exec()
        .then(hotel => {
            if(!hotel) {
                // ctx.throw(400, 'Invalid hotel');
                throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
            }
            let serviceIds = ctx.state.serviceIds;
            let services = hotel.services;
            serviceIds.forEach(serviceId => {
                if (!reservationServices.isValidObjectId(serviceId, services)) {
                    // ctx.throw(400, 'Invalid Services');
                    throw new DIPError(dipErrorDictionary.INVALID_SERVICES);
                }
            });

            ctx.state.hotel = hotel;

            let serviceMap = services.reduce((obj, service) => {
                obj[service.id] = service;
                return obj;
            }, Object.create({}));

            let userServices = ctx.request.body.services;
            let listOffer = [];
            userServices.forEach(service => {
                service.offers.map(offer => {
                    offer.service = service.id;
                    listOffer.push(offer);
                });
            });

            ctx.state.serviceMap = serviceMap;
            ctx.state.offerMap = {};
            ctx.state.userServices = userServices;
            let p = reservationServices.verifyOffers(ctx, () => {}, listOffer);
            return p.then(next);
        })
};

reservationServices.verifyOffers = function(ctx, next, offers) {
    let _offers = offers,
        offerIds = _offers.map(offer => offer.id),
        serviceIds = ctx.state.serviceIds,
        hotel = ctx.state.hotel;
    ctx.state.offerIds = offerIds;
    return db.offers.find({_id: {$in: offerIds}, service: {$in: serviceIds}})
        .populate('addons')
        .exec()
        .then(offers => {
            if (offers.length != _offers.length) {
                // ctx.throw(400, 'Invalid offer id');
                throw new DIPError(dipErrorDictionary.INVALID_OFFER_ID);
            }
            let baseOfferMap = offers.reduce((obj, offer) => {
                obj[offer.id] = offer;
                return obj;
            }, Object.create({}));
            let _offerMap = _offers.reduce((obj, offer) => {
                obj[offer.id] = offer;
                obj[offer.id].data = baseOfferMap[offer.id];
                return obj;
            }, Object.create({}));

            let needUpdateOffers = offers.map(offer => {
                let expected = _offerMap[offer._id.toString()],
                    price = 0;
                offer.hotel = hotel;

                reservationServices.checkValidOffer(expected, offer);

                let reserveDate = moment(expected.date).format('YYYY-MM-DD');
                // offer = reservationServices.increaseOfferCount(offer, reserveDate, expected.count);

                offer.reserveDate = reserveDate;
                offer.reserveCount = expected.count;

                if (!reservationServices.verifySpecialOffers(expected, offer)) {
                    // ctx.throw(400, 'Invalid special offer');
                    throw new DIPError(dipErrorDictionary.INVALID_SPECIAL_OFFER);
                }
                let addonPrice = expected.addons.reduce((total, addon) => {
                    return total + addon.price * addon.count;
                }, 0);
                price += expected.count * offer.price;
                price += addonPrice;

                ctx.state.beforeTax += price;
                return offer;
            });
            ctx.state.needUpdateOffers = needUpdateOffers;

            ctx.state.offerMap = Object.assign(ctx.state.offerMap, _offerMap);
            let expectedPrice = ctx.request.body.price;
            if (ctx.state.beforeTax != expectedPrice) {
                // ctx.throw(400, 'Unmatched total price');
                throw new DIPError(dipErrorDictionary.UNMATCHED_TOTAL_PRICE);
            }
            let taxPercent = config.taxPercent;
            ctx.state.tax = Math.round(taxPercent * ctx.state.beforeTax / 100);
            ctx.state.price = ctx.state.tax + ctx.state.beforeTax;
            return next();
        })
};


reservationServices.verifySpecialOffers = function(userOffer, offer) {
    if(userOffer.addons) {
        let length = userOffer.addons.length;
        let addonsMap = offer.addons.reduce((obj, addons) => {
            obj[addons.id] = addons;
            return obj;
        }, Object.create({}));
        for (let i = 0; i < length; i++) {
            let userSubOffer = userOffer.addons[i];
            let subOffer = addonsMap[userSubOffer.id];
            if (!subOffer || subOffer.price != userSubOffer.price
                || isNaN(userSubOffer.count) || (userSubOffer.count !== parseInt(userSubOffer.count, 10))
                || userSubOffer.count <= 0) {
                return false;
            }
        }
        offer.addonsMap = addonsMap;
    } else {
        userOffer.addons = [];
    }
    return true;
};

reservationServices.calculateOfferPromotion = function (ctx, next) {
    let promotionCode = ctx.request.body.promotionCode;
    if (promotionCode) {
        let hotel = ctx.request.body.hotel;
        let offers = ctx.state.offerIds;
        let needAddingDipCreditPromotionCode = true;
        let user = ctx.state.user;
        return promotionServices.dbGetPromotionCode(user, promotionCode, needAddingDipCreditPromotionCode, hotel, offers, null).then(promotion => {
            let substractTotalArray = [promotionTypes.SUBTRACT_TOTAL_PERCENT, promotionTypes.SUBTRACT_TOTAL_AMOUNT];
            if (substractTotalArray.indexOf(promotion.type) > -1) {
                return db.users.findById(user._id).exec().then(dataUser => {
                    if (dataUser.account.pendingPromotions.indexOf(promotion._id) > -1) {
                        throw new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED);
                    }
                    let offerMap = ctx.state.offerMap;
                    let listUserOffer = offers.map(offerId => {
                        return offerMap[offerId];
                    });
                    let taxPercent = config.taxPercent;
                    let promotionDiscount = promotionServices.calculatePromotionDiscountForOffer(promotion, listUserOffer, taxPercent);
                    if (!promotionDiscount.discount) {
                        throw new DIPError(dipErrorDictionary.INVALID_PROMOTION_CODE);
                    }
                    ctx.state.promotion = promotionDiscount;
                    if (promotionDiscount.taxType == promotionTaxTypes.BEFORE_TAX) {
                        ctx.state.beforeTax = ctx.state.beforeTax - promotionDiscount.discount;
                        ctx.state.tax = Math.round(taxPercent * ctx.state.beforeTax / 100);
                        ctx.state.price = ctx.state.tax + ctx.state.beforeTax;
                    } else {
                        ctx.state.price = ctx.state.price - promotionDiscount.discount;
                    }
                    ctx.state.basePromotion = promotion;
                    return next();
                });
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
};

reservationServices.markPromotionCodeIsUsed = function (ctx, next) {
    if (!ctx.state.basePromotion) {
        return next();
    }
    let promotion = ctx.state.basePromotion;
    return promotionServices.dbAddPromotionCodeToUser(ctx.state.user, promotion).then(() => {
        return next();
    }, () => {
        // throw new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED);
        console.error(new DIPError(dipErrorDictionary.PROMOTION_CODE_ALREADY_USED));
        return next();
    });
};

reservationServices.freezeOfferAmount = function(ctx, next) {
    let needUpdateOffers = ctx.state.needUpdateOffers;
    let p = needUpdateOffers.map(offer => {
        let update = {$inc: {}};
        let pendingReservationCount = `pendingReservationCount.${offer.reserveDate}`;
        update.$inc[pendingReservationCount] = offer.reserveCount;
        return db.offers.update({_id: offer._id}, update);
    });
    return Promise.all(p).then(next);
};

reservationServices.updateListOfferAndReleaseOfferAmount = function(ctx, next) {
    let needUpdateOffers = ctx.state.needUpdateOffers;
    let p = needUpdateOffers.map(offer => {
        let update = {$inc: {}};
        let pendingReservationCount = `pendingReservationCount.${offer.reserveDate}`;
        let reservationCount = `reservationCount.${offer.reserveDate}`;
        update.$inc[pendingReservationCount] = -offer.reserveCount;
        update.$inc[reservationCount] = offer.reserveCount;
        return db.offers.update({_id: offer._id}, update).then(result => {
        }, () => {
            console.error("releaseOfferAmount failed " + offer._id);
        });
    });
    return Promise.all(p).then(next);
};

reservationServices.releaseOfferAmount = function(listOffers) {
    return new Promise((resolve, reject) => {
        let p = listOffers.map(offer => {
            let update = {$inc: {}};
            let pendingReservationCount = `pendingReservationCount.${offer.reserveDate}`;
            update.$inc[pendingReservationCount] = -offer.reserveCount;
            return db.offers.update({_id: offer._id}, update).then(result => {
            }, () => {
                console.error("releaseOfferAmount failed " + offer._id);
            });
        });
        Promise.all(p).then(() => {
            resolve();
        }, () => {
            resolve();
        });
    });

};

// Final price must either be zero or greater than 50cent (stripe limit)
reservationServices.getDiscount = function(price, balance) {
    let discount = Math.min(balance, price);
    if (discount < price && discount > price - 50) {
        return price - 50;
    } else {
        return discount;
    }
};

reservationServices.calculateDipCreditDiscountAndCardChargeAmount = function (ctx, next) {
    let price = ctx.state.price,
        user = ctx.state.user;
    let discount = reservationServices.getDiscount(price, user.account.balance);
    let cardChargeAmount = price - discount;
    let promotion = ctx.state.basePromotion;
    ctx.state.dipCreditDiscount = discount;
    ctx.state.cardChargeAmount = cardChargeAmount;
    return reservationServices.freezeDipCreditAndPromotion(user, discount, promotion).then(next);
};

reservationServices.freezeDipCreditAndPromotion = function (user, dipCreditDiscount, promotion) {
    if (dipCreditDiscount || promotion) {
        let update = {};
        if (dipCreditDiscount) {
            update = {$inc: {"account.pendingBalance": dipCreditDiscount}};
        }
        if (promotion) {
            update.$addToSet = {"account.pendingPromotions": promotion._id};
        }
        return db.users.update({'_id': user._id}, update);
    } else {
        return Promise.resolve();
    }
};

reservationServices.updateAndReleaseDipCreditForUser = function (ctx, next) {
    let user = ctx.state.user,
        discount = ctx.state.dipCreditDiscount;
    if (discount > 0) {
        return db.users.update({'_id': user._id}, {$inc: {"account.pendingBalance": -discount, "account.balance": -discount}}).then(next);
    } else {
        return next();
    }
};

reservationServices.releaseDipCreditAndPromotionForUser = function (user, dipCreditDiscount, promotion) {
    let p = new Promise((resolve, reject) => {
        if (dipCreditDiscount || promotion) {
            let update = {};
            if (dipCreditDiscount) {
                update = {$inc: {"account.pendingBalance": -dipCreditDiscount}};
            }
            if (promotion) {
                update.$pull = {"account.pendingPromotions": promotion._id};
            }
            return db.users.update({'_id': user._id}, update).then(() => {
                resolve();
            }, () => {
                console.error("releaseDipCreditAndPromotionForUser failed " + user._id + " " + user.email);
                resolve();
            });
        } else {
            resolve();
        }
    });
    return p;
};

reservationServices.initHotelSubReservation = function(ctx, next) {
    let userServices = ctx.state.userServices,
        offerMap = ctx.state.offerMap,
        serviceMap = ctx.state.serviceMap,
        serviceIds = [],
        listHotelSubReservation = [];
    userServices.map(s => {
        let service = new db.hotelSubReservations({
            service: {
                ref: s.id,
                type: serviceMap[s.id].type,
                name: serviceMap[s.id].name,
                title: serviceMap[s.id].title,
                location: serviceMap[s.id].location
            },
            offers: s.offers.map(o => {
                let userOffer = offerMap[o.id],
                    addons = [];
                if(userOffer.addons) {
                    addons = userOffer.addons.reduce((arr, userSubOffer) => {
                        arr.push({
                            ref: userSubOffer.id,
                            count: userSubOffer.count,
                            price: userSubOffer.price
                        });
                        return arr;
                    }, []);
                }
                return {
                    ref: o.id,
                    members: userOffer.members,
                    count: userOffer.count,
                    date: userOffer.date,
                    addons: addons,
                    price: userOffer.data.price
                };
            })
        });
        listHotelSubReservation.push(service);
        serviceIds.push(service._id);
    });
    ctx.state.userServiceIds = serviceIds;
    ctx.state.listHotelSubReservation = listHotelSubReservation;
    return next();
};

reservationServices.saveHotelSubReservation = function(ctx, next) {
    let listHotelSubReservation = ctx.state.listHotelSubReservation;
    let p = listHotelSubReservation.map(subHotelReservation => {
        return subHotelReservation.save();
    });
    return Promise.all(p).then(() => {
        return next();
    });
};

reservationServices.initHotelReservation = function(ctx, next) {
    let user = ctx.state.user,
        serviceIds = ctx.state.userServiceIds,
        hotel = ctx.state.hotel,
        price = ctx.state.price,
        tax = ctx.state.tax,
        beforeTax = ctx.state.beforeTax,
        discount = ctx.state.dipCreditDiscount,
        userReservation = new db.hotelReservations({
            user: {
                ref: user,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            hotel: {
                ref: hotel._id,
                name: hotel.name,
                details: hotel.details,
                location: hotel.location
            },
            services: serviceIds,
            price: price,
            tax: tax,
            beforeTax: beforeTax
        });
    if (ctx.state.promotion) {
        userReservation.promotion = ctx.state.promotion;
    }
    if (user.account.balance > 0) {
        userReservation.promotionDiscount = discount;
    }
    ctx.state.reservation = userReservation;
    return next();
};

reservationServices.saveHotelReservation = function(ctx, next) {
    let userReservation = ctx.state.reservation;
    return userReservation.save().then((reservation) => {
        let condition = {'_id': reservation._id, type: reservation.type};
        return reservationServices.dbGetReservation(condition).then(reservations => {
            if (reservations && reservations.length > 0) {
                let reservation = reservations[0];
                ctx.body = entities.hotelReservation(reservation);
                notifyReservation(ctx.state.user, reservation, ctx.state.cardChargeAmount);
                sendConfirmationEmail(ctx.state.user, reservation, ctx.state.cardChargeAmount);
            } else {

            }
        });
    }).then(next);
};

reservationServices.createSale = function(ctx, next) {
    let user = ctx.state.user,
        userCard = ctx.state.userCard,
        finalAmount = ctx.state.cardChargeAmount,
        p;
    if (finalAmount > 0) {
        let userSale = new db.sales({
            state: 'Unpaid',
            stripe: {
                customerId: user.account.stripeId,
                cardInfo: userCard.toObject()
            },
            amount: finalAmount,
            reservation: ctx.state.reservation
        });

        ctx.state.sale = userSale;
        p = userSale.save();
    } else {
        p = Promise.resolve();
    }
    return p.then(next);
};

reservationServices.chargeSale = function(ctx, next) {
    let sale = ctx.state.sale;
    if (!sale) {
        return next();
    }
    let p = new Promise((resolve, reject) => {
        if (sale) {
            stripe.chargeSale(sale).then(charge => {
                resolve(charge);
            }, (error) => {
                let charge = {status: 'failed'};
                resolve(charge);
            });
        } else {
            resolve();
        }
    });

    return p.then((charge) => {
        sale.state = charge.status;
        return sale.save().then(() => {
            if (charge.status == 'failed') {
                return reservationServices.releaseDipCreditPromotionAndPendingReserveAmount(ctx).then(() => {
                    // ctx.throw(400, 'Card charging failed');
                    throw new DIPError(dipErrorDictionary.CARD_CHARGING_FAILED);
                });
            } else {
                return next();
            }
        });
    });
};

reservationServices.releaseDipCreditPromotionAndPendingReserveAmount = function (ctx) {
    return new Promise((resolve, reject) => {
        reservationServices.releaseDipCreditAndPromotionForUser(ctx.state.user, ctx.state.dipCreditDiscount, ctx.state.basePromotion).then(() => {
            if (ctx.state.needUpdateOffers) {
                reservationServices.releaseOfferAmount(ctx.state.needUpdateOffers).then(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
};

reservationServices.purchaseHotelPasses = compose([
    reservationServices.checkHotelReservationInput,
    reservationServices.verifyHotelServicesAndOffers,
    reservationServices.calculateOfferPromotion,
    reservationServices.freezeOfferAmount,
    reservationServices.calculateDipCreditDiscountAndCardChargeAmount,
    reservationServices.initHotelSubReservation,
    reservationServices.initHotelReservation,
    reservationServices.createSale,
    reservationServices.chargeSale,
    reservationServices.updateListOfferAndReleaseOfferAmount,
    reservationServices.markPromotionCodeIsUsed,
    reservationServices.updateAndReleaseDipCreditForUser,
    reservationServices.saveHotelSubReservation,
    reservationServices.saveHotelReservation
]);

module.exports = reservationServices;

function notifyReservation(user, reservation, chargeAmount) {
    let passes = [];
    reservation.services.forEach(subReservation => {
        subReservation.offers.forEach(offer => {
            passes.push(`${offer.ref.description} (${offer.count})`);
        });
    });
    let passesString = passes.join("\n");
    let data = [user.nameOrEmail, user.email, reservation.hotel.ref.name, passesString, chargeAmount / 100];
    
    return maker.dipHotelPassReservation({
        value1: data.join(' ||| ')
    });
}

function sendConfirmationEmail(user, reservation, chargeAmount) {
    let passes = [];
    reservation.services.forEach(subReservation => {
        subReservation.offers.forEach(offer => {
            let date = moment(offer.date),
                startTime = date.clone().add(moment.duration(offer.ref.duration.startTime / 60, 'hours')),
                endTime = date.clone().add(moment.duration(offer.ref.duration.endTime / 60, 'hours'));
            passes.push({
                passType: offer.ref.description,
                passCount: offer.count,
                date: date.format('LL'),
                startTime: startTime.format('LT'),
                endTime: endTime.format('LT')
            });
        });
    });
    let date = passes[0].date,
        thumbImg = reservation.hotel.ref.image.url;
    let data = {
        customerName: user.nameOrEmail,
        hotelName: reservation.hotel.ref.name,
        thumbImg: thumbImg,
        chargeAmount: (chargeAmount / 100).toFixed(2),
        passes: passes,
        date: date
    };
    let hotel = reservation.hotel.ref;
    let recipients = [config.mailTo.reservation];
    if (hotel.emails && hotel.emails.reservation) {
        recipients = recipients.concat(hotel.emails.reservation);
    }
    mailer.adminHotelReservationConfirmation(recipients, data);
    mailer.userReservationConfirmation([user.email], data);
}