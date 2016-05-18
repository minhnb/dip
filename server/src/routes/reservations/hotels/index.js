"use strict";

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const inputValidator = require('../../../validators');


const mailer = require('../../../mailer');

const stripe = require('../../../helpers/stripe');
const auth = require('../../../helpers/passport_auth');
module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        checkInput,
        verifyHotel,
        verifyPools,
        verifyOffers,
        createReservation,
        createSale,
        chargeSale,
        sendEmails,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.hotelReservations
                .find({'user.ref': ctx.state.user, type: 'Hotel'})
                .populate({
                    path: 'hotel.ref',
                    model: db.hotels
                })
                .populate({
                    path: 'services.pools.offers.ref',
                    model: db.offers
                })
                .populate({
                    path: 'services.pools.offers.addons.ref',
                    model: db.addons
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
    if(ctx.request.body.services.pools) {
        if(!Array.isArray(ctx.request.body.services.pools)) ctx.throw(400, 'Pools must be an array');
        ctx.state.pools = ctx.request.body.services.pools;
        ctx.state.poolIds = ctx.state.pools.map(pool => pool.id);
    }

    let userCard = user.account.cards.id(userCardId);
    if (!userCard) {
        ctx.throw(400, 'Invalid card id');
    }
    if (!userCard.passCvc) {
        ctx.throw(400, 'Cvc checking failed');
    }

    ctx.state.userCard = userCard;
    return next();
}

function verifyHotel(ctx, next) {
    let poolIds = ctx.state.poolIds;
    return db.hotels.findOne({_id: ctx.request.body.hotel,
        'services.pools.ref': {$in: poolIds}
    })
    .exec()
    .then(hotel => {
        if(!hotel) ctx.throw(400, 'Invalid hotel');
        ctx.state.hotel = hotel;
        return next();
    })
}

function verifyPools(ctx, next) {
    let poolIds = ctx.state.poolIds;
    return db.pools.find({_id: {$in: poolIds}})
    .exec()
    .then(pools => {
        if(pools.length < poolIds.length) ctx.throw(400, 'Invalid Pool');
        ctx.state.poolMap = pools.reduce((obj, pool) => {
            obj[pool.id] = pool;
            return obj;
        }, Object.create({}));
        return next();
    });
}

function verifyOffers(ctx, next) {
    let pools = ctx.state.pools;
    let price = 0;
    let expectedPrice = ctx.request.body.price;
    let offerMap = {};
    let p = pools.map(pool => {
        let _offers = pool.offers;
        let offerIds = _offers.map(o => o.id);
        return db.offers.find({
            _id: {$in: offerIds},
            pool: pool.id
        })
        .populate('addons')
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

            ctx.state.offers = offers;
            offers.forEach(offer => {
                let expected = _offerMap[offer._id.toString()];
                
                if (!expected) {
                    ctx.throw(400, 'Invalid offer id');
                }

                if(!expected.count) ctx.throw(400, 'Missing quantities');
                if(expected.count < 0) ctx.throw(400, 'quantities must be large then zero');

                if (expected.count + offer.reservationCount > offer.allotmentCount) {
                    ctx.throw(400, 'Overbooking offer');
                }
                offer.reservationCount += expected.count;

                if (!verifySpecialOffers(expected, offer)) {
                    ctx.throw(400, 'Invalid special offer');
                }
                let addonPrice = expected.addons.reduce((total, addon) => {
                    return total + addon.price * addon.count;
                }, 0);
                price += expected.count * offer.price;
                price += addonPrice;
            });
            offerMap = Object.assign(offerMap, _offerMap);
            return Promise.all(offers.map(o => o.save()));
        })
    })
    return Promise.all(p).then(() => {
        ctx.state.price = price;
        ctx.state.offerMap = offerMap;
        return next();  
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

function createReservation(ctx, next) {
    let user = ctx.state.user,
        pools = ctx.state.pools,
        hotel = ctx.state.hotel,
        poolMap = ctx.state.poolMap,
        price = ctx.state.price,
        offerMap = ctx.state.offerMap,
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
            services: {
                pools: pools.map(p => {
                    return {
                        pool: {
                            ref: p.id,
                            name: poolMap[p.id].name,
                            title: poolMap[p.id].title,
                            location: poolMap[p.id].location
                        },
                        offers: p.offers.map(offer => {
                            let userOffer = offerMap[offer.id],
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
                                ref: offer.id,
                                members: userOffer.members,
                                count: userOffer.count,
                                addons: addons,
                                price: userOffer.data.price
                            };
                        })
                    }  
                })
            },
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
    let hotelReservations = JSON.parse(JSON.stringify(ctx.state.reservation)),
            offerMap = ctx.state.offerMap,
            user = ctx.state.user;
    hotelReservations.services.pools.map(pool => {      
        pool.offers.map(offer => {
            offer.data = offerMap[offer.ref].data
        })
    })
    mailer.confirmHotelReservation(user.email, hotelReservations);
    return next();
}