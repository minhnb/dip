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

var reservationServices = {};

reservationServices.dbGetReservation = function (user) {
    return db.hotelReservations
        .find({'user.ref': user, type: 'HotelReservation'})
        .populate({
            path: 'hotel.ref',
            model: db.hotels
        })
        .populate({
            path: 'services',
            model: db.hotelSubReservations,
            populate: [{
                path: 'offers.ref',
                model: db.offers
            },
                {
                    path: 'offers.addons.ref',
                    model: db.addons
                }]
        })
        .exec()
        .then(reservations => {
            return reservations;
        });
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
    return reservationServices.dbGetReservation(user).then(reservations => {
        return reservations.map(entities.hotelReservation);
    });
};

reservationServices.checkInput = function(ctx, next) {
    let user = ctx.state.user,
        userCardId = ctx.request.body.cardId;
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
    ctx.state.serviceIds = ctx.request.body.services.map(service => service.id);
    return next();
};

reservationServices.verifyHotel = function(ctx, next) {
    return db.hotels.findOne({_id: ctx.request.body.hotel})
        .exec()
        .then(hotel => {
            if(!hotel) {
                // ctx.throw(400, 'Invalid hotel');
                throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
            }
            ctx.state.hotel = hotel;
            return next();
        })
};

reservationServices.verifyServices = function(ctx, next) {
    let serviceIds = ctx.state.serviceIds;
    return db.hotelServices.find({_id: {$in: serviceIds}})
        .exec()
        .then(services => {
            if(services.length < serviceIds.length) {
                // ctx.throw(400, 'Invalid Services');
                throw new DIPError(dipErrorDictionary.INVALID_SERVICES);
            }
            return next();
        });
};

reservationServices.verifyRequestServices = function(ctx, next) {
    let userServices = ctx.request.body.services,
        serviceIds = ctx.state.serviceIds;
    ctx.state.beforeTax = 0;
    ctx.state.offerMap = {};

    return db.hotelServices
        .find({_id: {$in: serviceIds}})
        .exec()
        .then(services => {
            let serviceMap = services.reduce((obj, service) => {
                obj[service.id] = service;
                return obj;
            }, Object.create({}));
            ctx.state.serviceMap = serviceMap;
            let p = userServices.map(service => {
                return reservationServices.verifyOffers(ctx, () => {}, service.offers);
            });
            ctx.state.userServices = userServices;
            return Promise.all(p).then(next);
        })
};


reservationServices.verifyOffers = function(ctx, next, offers) {
    let _offers = offers,
        offerIds = _offers.map(offer => offer.id);
    ctx.state.offerIds = offerIds;
    return db.offers.find({_id: {$in: offerIds}})
        .populate('addons')
        .populate(['hotel', 'service'])
        .exec()
        .then(offers => {
            if (offers.length < _offers.length) {
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

            let p = offers.map(offer => {
                let expected = _offerMap[offer._id.toString()],
                    price = 0;
                if (!expected) {
                    // ctx.throw(400, 'Invalid offer id');
                    throw new DIPError(dipErrorDictionary.INVALID_OFFER_ID);
                }

                if(!expected.date) {
                    // ctx.throw(400, 'Missing offer date');
                    throw new DIPError(dipErrorDictionary.MISSING_OFFER_DATE);
                }

                if(!expected.count) {
                    // ctx.throw(400, 'Missing quantities');
                    throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
                }
                if(expected.count < 0) {
                    // ctx.throw(400, 'quantities must be large then zero');
                    throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
                }

                if (expected.price != offer.price) {
                    // ctx.throw(400, 'Unmatched offer price');
                    throw new DIPError(dipErrorDictionary.UNMATCHED_OFFER_PRICE);
                }

                let startDay = moment().weekday(),
                    startDate = moment().weekday(startDay).format('YYYY-MM-DD'),
                    maxDaysReservation = moment(startDate).add(14, 'days').format('YYYY-MM-DD'),
                    reservDay = moment(expected.date).weekday(),
                    reservDate = moment(expected.date).format('YYYY-MM-DD'),
                    offerTime = moment.tz(reservDate, offer.hotel.address.timezone).add(moment.duration(offer.duration.startTime/60, 'hours'));

                if(offer.days.indexOf(reservDay) == -1 ||
                    offerTime < moment().tz(offer.hotel.address.timezone) ||
                    moment(reservDate) > moment(maxDaysReservation) ||
                    moment(offer.dueDay) < moment(reservDate) ||
                    moment(offer.startDay) > moment(reservDate)) {
                    // ctx.throw(400, 'Not serve');
                    throw new DIPError(dipErrorDictionary.OFFER_NOT_SERVE);
                }

                if(offer.reservationCount && offer.reservationCount[reservDate] &&
                    offer.reservationCount[reservDate] + expected.count > offer.allotmentCount)
                {
                    // ctx.throw(400, 'Over booking');
                    throw new DIPError(dipErrorDictionary.OFFER_OVERBOOKING);
                }

                if (offer.reservationCount == undefined) {
                    offer.reservationCount = {};
                }
                offer.reservationCount[reservDate] ?
                    offer.reservationCount[reservDate] += expected.count :
                    offer.reservationCount[reservDate] = expected.count
                offer.markModified('reservationCount');

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
                return offer.save();
            });
            return Promise.all(p).then(() => {
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
        return promotionServices.getPromotionCode(ctx.state.user, promotionCode, needAddingDipCreditPromotionCode, hotel, offers, null).then(promotion => {
            let substractTotalArray = [promotionTypes.SUBTRACT_TOTAL_PERCENT, promotionTypes.SUBTRACT_TOTAL_AMOUNT];
            if (substractTotalArray.indexOf(promotion.type) > -1) {
                let offerMap = ctx.state.offerMap;
                let listUserOffer = offers.map(offerId => {
                    return offerMap[offerId];
                });
                let taxPercent = config.taxPercent;
                let promotionDiscount = promotionServices.calculatePromotionDiscountForOffer(promotion, listUserOffer, taxPercent);
                if (promotionDiscount.discount > 0) {
                    ctx.promotion = promotionDiscount;
                    if (promotionDiscount.taxType == promotionTaxTypes.BEFORE_TAX) {
                        ctx.state.beforeTax = ctx.state.beforeTax - promotionDiscount.discount;
                        ctx.state.tax = Math.round(taxPercent * ctx.state.beforeTax / 100);
                        ctx.state.price = ctx.state.tax + ctx.state.beforeTax;
                    } else {
                        ctx.state.price = ctx.state.price - promotionDiscount.discount;
                    }
                }
                return next();
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
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

reservationServices.createHotelSubReservation = function(ctx, next) {
    let userServices = ctx.state.userServices,
        offerMap = ctx.state.offerMap,
        serviceMap = ctx.state.serviceMap,
        serviceIds = [];
    let p = userServices.map(s => {
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
        return service.save().then(res => {
            serviceIds.push(res._id);
        });
    });
    return Promise.all(p).then(() => {
        ctx.state.userServiceIds = serviceIds;
        return next();
    })
};

reservationServices.createHotelReservation = function(ctx, next) {
    let user = ctx.state.user,
        serviceIds = ctx.state.userServiceIds,
        hotel = ctx.state.hotel,
        price = ctx.state.price,
        tax = ctx.state.tax,
        beforeTax = ctx.state.beforeTax,
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
    if (ctx.promotion) {
        userReservation.promotion = ctx.promotion;
    }
    let p = Promise.resolve();
    if (user.account.balance > 0) {
        let discount = reservationServices.getDiscount(price, user.account.balance);
        user.account.balance -= discount;
        userReservation.promotionDiscount = discount;
        p = user.save();
    }

    ctx.state.reservation = userReservation;
    return p.then(user => {
        return userReservation.save();
    }).then(next);
};

reservationServices.createSale = function(ctx, next) {
    let user = ctx.state.user,
        userCard = ctx.state.userCard,
        discount = ctx.state.reservation.promotionDiscount || 0,
        price = ctx.state.price,
        finalAmount = price - discount,
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
    let sale = ctx.state.sale,
        p = Promise.resolve();
    if (sale) {
        p = stripe.chargeSale(sale).then(charge => {
            sale.state = charge.status;
            return sale.save().then(() => {
                if (charge.status == 'failed') {
                    // ctx.throw(400, 'Card charging failed');
                    throw new DIPError(dipErrorDictionary.CARD_CHARGING_FAILED);
                }
            });
        })
    }
    return p.then(next);
};

reservationServices.createHotelReservation = compose([
    reservationServices.checkInput,
    reservationServices.verifyHotel,
    reservationServices.verifyServices,
    reservationServices.verifyRequestServices,
    reservationServices.calculateOfferPromotion,
    reservationServices.createHotelSubReservation,
    reservationServices.createHotelReservation,
    reservationServices.createSale,
    reservationServices.chargeSale
]);

module.exports = reservationServices;