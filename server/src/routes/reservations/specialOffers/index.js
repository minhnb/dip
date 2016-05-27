"use strict";

const router = require('koa-router')();
const moment = require('moment');

const db = require('../../../db');
const inputValidator = require('../../../validators');
const entities = require('../../../entities');
const mailer = require('../../../mailer');
const stripe = require('../../../helpers/stripe');

const auth = require('../../../helpers/passport_auth');
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
            .find({'user.ref': ctx.state.user, type: 'SpecialOffer'})
            .populate({
                path: 'specialOffer.ref',
                model: db.specialOffers
            })
            .populate({
                path: 'offers.ref',
                model: db.offers
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
    if(!ctx.request.body.services) ctx.throw(400, 'Invalid services');
    if(!ctx.request.body.offerId) ctx.throw(400, 'Missing offer id');
    if(!Array.isArray(ctx.request.body.services)) ctx.throw(400, 'Services must be an array');

    let userCard = user.account.cards.id(userCardId);
    if (!userCard) {
        ctx.throw(400, 'Invalid card id');
    }
    if (!userCard.passCvc) {
        ctx.throw(400, 'Cvc checking failed');
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
        if(!offer) ctx.throw(400, 'Invalid offer');
        ctx.state.offer = offer;
        return next();
    })
}

function verifyServices(ctx, next) {
    let serviceIds = ctx.state.serviceIds;
    return db.hotelServices.find({_id: {$in: serviceIds}})
    .exec()
    .then(services => {
        if(services.length < serviceIds.length) ctx.throw(400, 'Invalid Services');
        return next();
    });
}

function verifyRequestServices(ctx, next) {
    let userServices = ctx.request.body.services,
        serviceIds = ctx.state.serviceIds;
    ctx.state.price = 0;
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
    .exec()
    .then(offers => {
        if (offers.length < _offers.length) ctx.throw(400, 'Invalid offer id');
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
                ctx.throw(400, 'Invalid offer id');
            }
            if(!expected.date) ctx.throw(400, 'Missing offer date');
           

            let startDay = moment().weekday(),
                startDate = moment().weekday(startDay).format('YYYY-MM-DD'),
                next7Days = moment(startDate).add(7, 'days').format('YYYY-MM-DD'),
                reservDate = expected.date,
                reservDay = moment(reservDate).weekday();

            if(baseOfferMap[offer.id].days.indexOf(reservDay) == -1 || moment(reservDate) < moment() || moment(reservDate) > moment(next7Days) || moment(offer.dueDay) < moment(reservDate) || moment(offer.startDate) > moment(reservDate)) ctx.throw(400, 'Not serve');

            if(baseOfferMap[offer.id].reservationCount[reservDate] && baseOfferMap[offer.id].reservationCount[reservDate] + expected.count > baseOfferMap[offer.id].allotmentCount) ctx.throw(400, 'Over booking'); 

            if(!expected.count) ctx.throw(400, 'Missing quantities');
            if(expected.count < 0) ctx.throw(400, 'quantities must be large then zero');
            if (expected.price != offer.price) {
                ctx.throw(400, 'Unmatched offer price');
            }

            if(offer.reservationCount[reservDate]) {
                offer.reservationCount[reservDate] += expected.count
            } else {
                offer.reservationCount[reservDate] = expected.count
            }
            offer.markModified('reservationCount');

            price += expected.count * offer.price;

            ctx.state.price += price;
            return offer.save();
        });
        return Promise.all(p).then(() => {
            ctx.state.offerMap = Object.assign(ctx.state.offerMap, _offerMap);
            let expectedPrice = ctx.request.body.price;
            if (ctx.state.price != expectedPrice) {
                ctx.throw(400, 'Unmatched total price');
            }
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
                        service: service.id
                    }
                }));
            }, []),
            price: price
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
                    ctx.throw(400, 'Card charging failed');
                }
            });
        })
    }
    return p.then(next);
}

function sendEmails(ctx, next) {
}