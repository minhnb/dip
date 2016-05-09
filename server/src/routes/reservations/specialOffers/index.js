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
        validateInput,
        validateOffers,
        createReservation,
        createSale,
        chargeSale,
        sendEmail,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.reservations
            .find({'user.ref': ctx.state.user, type: 'SpecialOffer'})
            .exec()
            .then(reservations => {
                ctx.body = {reservations: reservations.map(entities.specialOfferReservation)};
            });
        }
    );

function validateInput(ctx, next) {
    if(!ctx.request.body.offerId) ctx.throw(400, 'Missing Offer Id');
    if(!ctx.request.body.pools) ctx.throw(400, 'Missing Pools');
    if(!Array.isArray(ctx.request.body.pools)) ctx.throw(400, 'Pools must be an array');
    if(!ctx.request.body.cardId) ctx.throw(400, 'Missing cardId');
    //verify usercard
    let userCardId = ctx.request.body.cardId;
    let userCard = ctx.state.user.account.cards.id(userCardId);
    if (!userCard) {
        ctx.throw(400, 'Invalid card id');
    }
    if (!userCard.passCvc) {
        ctx.throw(400, 'Cvc checking failed');
    }
    ctx.state.userCard = userCard;

    let pools = ctx.request.body.pools;
    pools.forEach(pool => {
        if(!pool.id) ctx.throw(400, 'Missing pool id');
        if(!Array.isArray(pool.slots)) ctx.throw(400, 'slots must be an array');
        pool.slots.forEach(slot => {
            if(!slot.date) ctx.throw(400, 'Missing date');
            let quantities = parseInt(slot.quantities);
            if(!quantities) ctx.throw(400, 'Missing quantities');
            if(quantities < 0) ctx.throw(400, 'quantities must be large then zero');
        })
    })
    let poolIds = ctx.request.body.pools.map(pool => pool.id);
    
    return db.pools.find({_id: {$in: poolIds}})
    .exec()
    .then(pools => {
        if(pools.length !== poolIds.length) ctx.throw(400, 'Invalid Pool');
        ctx.state.poolIds = poolIds;
        ctx.state.pools = ctx.request.body.pools;
        return next();
    })
}

function validateOffers(ctx, next) {
    let offerId = ctx.request.body.offerId;
    return db.specialOffers
    .findOne({
        _id: offerId,
        'pools.ref': {$all: ctx.state.poolIds}
    })
    .populate('pools.ref')
    .exec()
    .then(offer => {
        if(!offer) ctx.throw(400, 'Invalid offer');
        ctx.state.offer = offer;
        let pools = offer.pools;

        let poolMap = pools.reduce((obj, pool) => {
            obj[pool.ref.id] = pool;
            return obj;
        }, Object.create({}));

        let price = 0;
        let startDay = moment().weekday();
        let startDate = moment().weekday(startDay).format('YYYY-MM-DD');
        let next7Days = moment(startDate).add(7, 'days').format('YYYY-MM-DD');
        ctx.state.pools.map(pool => {
            pool.slots.map(slot => {
                let reservDate = slot.date;
                let reservDay = moment(reservDate).weekday();
                if(poolMap[pool.id].days.indexOf(reservDay) == -1 || reservDate < moment() || reservDay > next7Days) ctx.throw(400, 'Not serve');
                if(poolMap[pool.id].reservationCount[reservDate] && poolMap[pool.id].reservationCount[reservDate] + slot.quantities > poolMap[pool.id].allotmentCount) ctx.throw(400, 'Over booking'); 
                price += offer.price * slot.quantities;
            }); 
            
        });

        ctx.state.price = price;
        ctx.state.poolMap = poolMap;
        return next();
    })
}

function createReservation(ctx, next) {
    let user = ctx.state.user,
        offer = ctx.state.offer,
        poolMap = ctx.state.poolMap,
        price = ctx.state.price,
        pools = ctx.state.pools;


    let userOffers = pools.map(pool => {
        return {
            pool: pool.id,
            name: poolMap[pool.id].ref.name,
            location: poolMap[pool.id].ref.location,
            duration: poolMap[pool.id].duration,
            slots: pool.slots.map(slot => {
                return {
                    date: slot.date,
                    count: slot.quantities,
                    total: offer.price * slot.quantities
                }
            }),
            price: price
        };

    });
    let specialOfferResevation = new db.specialOfferReservations({
        name: offer.name,
        user: {
            ref: user,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        },
        details: {
            ref: offer,
            offers: userOffers,
        },
        price: price
    });

    return db.specialOffers.findOne({_id: offer})
    .exec()
    .then(offer => {
        offer.pools.map(pool => {
            pools.map(userPool => {
                if(pool.ref == userPool.id) {
                    userPool.slots.map(slot => {
                        let date = slot.date;
                        let quantities = slot.quantities;
                        if(pool.reservationCount[date]) {
                            pool.reservationCount[date] += quantities
                        } else {
                            pool.reservationCount[date] = quantities
                        }
                        pool.markModified('reservationCount');
                    })
                }
            })
        });
        return offer.save().then(() => {
            let p = Promise.resolve();
            if (user.account.balance > 0) {
                let discount = getDiscount(price, user.account.balance);
                user.account.balance -= discount;
                specialOfferResevation.promotionDiscount = discount;
                p = user.save();
            }

            ctx.state.specialOfferResevation = specialOfferResevation;
            return p.then(user => {
                return specialOfferResevation.save();
            }).then(next);
        });
    })
}

function getDiscount(price, balance) {
    let discount = Math.min(balance, price);
    if (discount < price && discount > price - 50) {
        return price - 50;
    } else {
        return discount;
    }
}

function createSale(ctx, next) {
    let user = ctx.state.user,
        userCard = ctx.state.userCard,
        discount = ctx.state.specialOfferResevation.promotionDiscount || 0,
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
            reservation: ctx.state.specialOfferResevation
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

function sendEmail(ctx, next) {
    mailer.confirmSpecialOfferReservation(ctx.state.user.email, ctx.state.specialOfferResevation);
    return next();
}
