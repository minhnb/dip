"use strict";

const router = require('koa-router')();
const moment = require('moment-timezone');

const db = require('../../../db');
const inputValidator = require('../../../validators');
const entities = require('../../../entities');
const mailer = require('../../../mailer');
const stripe = require('../../../helpers/stripe');
const config = require('../../../config');

const auth = require('../../../auth');

const dipErrorDictionary = require('../../../constants/dipErrorDictionary');
const DIPError = require('../../../helpers/DIPError');

module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        checkInput,
        verifySpecialOffer,
        verifyServices,
        verifyRequestServices,
        createReservation,
        createSale,
        chargeSale,
        // sendEmail,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.reservations
            .find({'user.ref': ctx.state.user, type: 'SpecialOfferReservation'})
            .populate({
                path: 'specialOffer.ref',
                model: db.specialOffers
            })
            .populate({
                path: 'offers.ref',
                model: db.offers
            })
            .populate({
                path: 'offers.service',
                model: db.hotelServices,
            })
            .exec()
            .then(reservations => {
                ctx.body = {reservations: reservations.map(entities.specialOfferReservation)};
            });
        }
    );

function checkInput(ctx, next) {
    let user = ctx.state.user,
        userCardId = ctx.request.body.cardId;
    if(!ctx.request.body.services) {
        // ctx.throw(400, 'Invalid services');
        throw new DIPError(dipErrorDictionary.INVALID_SERVICES);
    }
    if(!ctx.request.body.offerId) {
        // ctx.throw(400, 'Missing offer id');
        throw new DIPError(dipErrorDictionary.MISSING_OFFER_ID);
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
}

function verifySpecialOffer(ctx, next) {
    let serviceIds = ctx.state.serviceIds,
        offerId = ctx.request.body.offerId;
    return db.specialOffers
    .findOne({
        _id: offerId,
        'hotels.hosts': {$all: ctx.state.serviceIds}
    })
    .populate('hotels.hosts')
    .exec()
    .then(offer => {
        if(!offer) {
            // ctx.throw(400, 'Invalid offer');
            throw new DIPError(dipErrorDictionary.OFFER_NOT_FOUND);
        }
        ctx.state.offer = offer;
        return next();
    })
}

function verifyServices(ctx, next) {
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
}

function verifyRequestServices(ctx, next) {
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
            return verifyOffers(ctx, () => {}, service.offers);
        })
        ctx.state.userServices = userServices;
        return Promise.all(p).then(next);
    })    
}


function verifyOffers(ctx, next, offers) {
    let _offers = offers,
        offerIds = _offers.map(offer => offer.id);
    return db.offers.find({_id: {$in: offerIds}})
    .populate('hotel')
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
           

            let startDay = moment().weekday(),
                startDate = moment().weekday(startDay).format('YYYY-MM-DD'),
                maxDaysReservation = moment(startDate).add(14, 'days').format('YYYY-MM-DD'),
                reservDay = moment(expected.date).weekday(),
                reservDate = moment(expected.date).format('YYYY-MM-DD'),
                offerTime = moment.tz(reservDate, offer.hotel.address.timezone).add(moment.duration(offer.duration.startTime/60, 'hours'));
                
            if(baseOfferMap[offer.id].days.indexOf(reservDay) == -1 || 
                offerTime < moment().tz(offer.hotel.address.timezone) || 
                moment(reservDate) > moment(maxDaysReservation) ||
                moment(offer.dueDay) < moment(reservDate) || 
                moment(offer.startDay) > moment(reservDate)) {
                // ctx.throw(400, 'Not serve');
                throw new DIPError(dipErrorDictionary.OFFER_NOT_SERVE);
            }
                    

            if(baseOfferMap[offer.id].reservationCount[reservDate] && 
                baseOfferMap[offer.id].reservationCount[reservDate] + expected.count > baseOfferMap[offer.id].allotmentCount) 
            {
                // ctx.throw(400, 'Over booking');
                throw new DIPError(dipErrorDictionary.OFFER_OVERBOOKING);
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

            offer.reservationCount[reservDate] ? 
                offer.reservationCount[reservDate] += expected.count : 
                offer.reservationCount[reservDate] = expected.count

            offer.markModified('reservationCount');

            price += expected.count * offer.price;

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
}

// Final price must either be zero or greater than 50cent (stripe limit)
function getDiscount(price, balance) {
    let discount = Math.min(balance, price);
    if (discount < price && discount > price - 50) {
        return price - 50;
    } else {
        return discount;
    }
}


function createReservation(ctx, next) {
    let user = ctx.state.user,
        offer = ctx.state.offer,
        price = ctx.state.price,
        tax = ctx.state.tax,
        beforeTax = ctx.state.beforeTax,
        offerMap = ctx.state.offerMap,
        userServices = ctx.state.userServices,
        userReservation = new db.specialOfferReservations({
            user: {
                ref: user,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            specialOffer: {
                ref: offer,
                name: offer.name
            },
            offers: userServices.reduce((arr, service) => {
                return arr.concat(service.offers.map(o => {
                    return {
                        ref: o.id,
                        count: offerMap[o.id].count,
                        price: offerMap[o.id].data.price,
                        date: offerMap[o.id].date,
                        service: service.id
                    }
                }));
            }, []),
            price: price,
            tax: tax,
            beforeTax: beforeTax
        });
    let p = Promise.resolve();
    if (user.account.balance > 0) {
        let discount = getDiscount(price, user.account.balance);
        user.account.balance -= discount;
        userReservation.promotionDiscount = discount;
        p = user.save();
    }

    ctx.state.reservation = userReservation;
    return p.then(user => {
        return userReservation.save();
    }).then(next);
}

function createSale(ctx, next) {
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
}

function chargeSale(ctx, next) {
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
}

function sendEmails(ctx, next) {
}
