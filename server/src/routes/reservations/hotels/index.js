"use strict";

const router = require('koa-router')();
const moment = require('moment-timezone');

const db = require('../../../db');
const entities = require('../../../entities');
const inputValidator = require('../../../validators');


const mailer = require('../../../mailer');

const stripe = require('../../../helpers/stripe');
const auth = require('../../../helpers/passport_auth');
const config = require('../../../config');

module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        checkInput,
        verifyHotel,
        verifyServices,
        verifyRequestServices,
        createSubReservation,
        createReservation,
        createSale,
        chargeSale,
        // sendEmails,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.hotelReservations
                .find({'user.ref': ctx.state.user, type: 'HotelReservation'})
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
                        model: db.addons, 
                    }]
                })
                .exec()
                .then(reservations => {
                    ctx.body = {reservations: reservations.map(entities.hotelReservation)};
                });
        }
    );

function checkInput(ctx, next) {
    let user = ctx.state.user,
        userCardId = ctx.request.body.cardId;
    if(!ctx.request.body.services) ctx.throw(400, 'Invalid services');
    if(!ctx.request.body.hotel) ctx.throw(400, 'Missing hotel id');
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

function verifyHotel(ctx, next) {
    let serviceIds = ctx.state.serviceIds;
    return db.hotels.findOne({_id: ctx.request.body.hotel})
    .exec()
    .then(hotel => {
        if(!hotel) ctx.throw(400, 'Invalid hotel');
        ctx.state.hotel = hotel;
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
    .populate('addons')
    .populate('hotel')
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
                reservDay = moment(expected.date).weekday(),
                reservDate = moment(expected.date).format('YYYY-MM-DD'),
                offerTime = moment.tz(reservDate, offer.hotel.address.timezone).add(moment.duration(offer.duration.startTime/60, 'hours'));
                
            if(baseOfferMap[offer.id].days.indexOf(reservDay) == -1 || 
                offerTime < moment().tz(offer.hotel.address.timezone) || 
                moment(reservDate) > moment(next7Days) || 
                moment(offer.dueDay) < moment(reservDate) || 
                moment(offer.startDay) > moment(reservDate)) ctx.throw(400, 'Not serve');

            if(baseOfferMap[offer.id].reservationCount[reservDate] && 
                baseOfferMap[offer.id].reservationCount[reservDate] + expected.count > baseOfferMap[offer.id].allotmentCount) 
                    ctx.throw(400, 'Over booking'); 

            offer.reservationCount[reservDate] ? 
                offer.reservationCount[reservDate] += expected.count : 
                offer.reservationCount[reservDate] = expected.count
            offer.markModified('reservationCount');

            if(!expected.count) ctx.throw(400, 'Missing quantities');
            if(expected.count < 0) ctx.throw(400, 'quantities must be large then zero');

            if (expected.price != offer.price) {
                ctx.throw(400, 'Unmatched offer price');
            }

            if (!verifySpecialOffers(expected, offer)) {
                ctx.throw(400, 'Invalid special offer');
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
                ctx.throw(400, 'Unmatched total price');
            }
            let taxPercent = config.taxPercent;
            ctx.state.tax = Math.round(taxPercent * ctx.state.beforeTax / 100);
            ctx.state.price = ctx.state.tax + ctx.state.beforeTax;
            return next();
        })
    })
}


function verifySpecialOffers(userOffer, offer) {
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

function createSubReservation(ctx, next) {
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
                    };
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
}

function createReservation(ctx, next) {
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