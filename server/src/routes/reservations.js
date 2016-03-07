"use strict";

const router = require('koa-router')();

const db = require('../db');
const entities = require('../entities');
const inputValidator = require('../validators');

const mailer = require('../mailer');

const stripe = require('../helpers/stripe');
const auth = require('../helpers/passport_auth');
module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        inputValidator.reservations.addReservation(),
        ctx => {
            let user = ctx.state.user,
                poolId = ctx.request.body.pool,
                _offers = ctx.request.body.offers,
                userCardId = ctx.request.body.cardId,
                expectedPrice = ctx.request.body.price,
                invites = ctx.request.body.invites;

            if (invites && !Array.isArray(invites)) {
                ctx.throw(400, 'Invites must be a list');
            }
            if (!invites) {
                invites = [];
            }
            let friendSet = new Set(user.friends.map(f => f.toString()));
            invites.forEach(i => {
                if (!friendSet.has(i)) {
                    ctx.throw(400, 'Invitee must be a friend');
                }
            });

            let userCard = user.account.cards.id(userCardId);
            if (!userCard) {
                ctx.throw(400, 'Invalid card id');
            }
            if (!userCard.passCvc) {
                ctx.throw(400, 'Cvc checking failed');
            }

            return db.pools.findById(poolId)
                .exec()
                .then(pool => {
                    if (!pool) {
                        ctx.throw(400, 'Invalid pool');
                    }
                    let offerIds = _offers.map(o => o.id);
                    return db.offers.find({
                        _id: {$in: offerIds},
                        pool: pool
                    }).exec()
                        .then(offers => {
                            if (offers.length < _offers.length) {
                                ctx.throw(400, 'Invalid offer id');
                            }

                            let offerMap = _offers.reduce((obj, offer) => {
                                obj[offer.id] = offer;
                                return obj;
                            }, Object.create({}));

                            let price = 0;

                            offers.forEach(offer => {
                                let expected = offerMap[offer._id.toString()];
                                if (!expected) {
                                    ctx.throw(400, 'Invalid offer id');
                                }
                                if (expected.count + offer.reservationCount > offer.allotmentCount) {
                                    ctx.throw(400, 'Overbooking offer');
                                }
                                if (expected.price != offer.ticket.price) {
                                    ctx.throw(400, 'Unmatched offer price');
                                }
                                offer.reservationCount += expected.count;

                                price += expected.count * offer.ticket.price;
                            });

                            if (price != expectedPrice) {
                                ctx.throw(400, 'Unmatched total price');
                            }

                            return Promise.all(offers.map(o => o.save()))
                                .then(() => {
                                    let userReservation = new db.reservations({
                                        user: {
                                            ref: user,
                                            email: user.email,
                                            firstName: user.firstName,
                                            lastName: user.lastName
                                        },
                                        pool: {
                                            ref: pool,
                                            name: pool.name,
                                            title: pool.title,
                                            location: pool.location
                                        },
                                        price: price,
                                        offers: offers.map(o => {
                                            return {
                                                ref: o._id,
                                                details: o.toObject(),
                                                count: offerMap[o._id.toString()].count
                                            };
                                        }),
                                        friends: invites
                                    });
                                    let p = Promise.resolve();
                                    if (user.account.balance > 0) {
                                        let discount = getDiscount(price, user.account.balance);
                                        user.account.balance -= discount;
                                        userReservation.promotionDiscount = discount;
                                        p = user.save();
                                    }
                                    return p.then(user => {
                                        return userReservation.save();
                                    });
                                })
                                .then(userReservation => {
                                    let discount = userReservation.promotionDiscount || 0,
                                        finalAmount = price - discount;

                                    ctx.state.userReservation = userReservation;

                                    // ctx.state.userReservation.user = {
                                    //     firstName: user.firstName
                                    // };
                                    if (finalAmount > 0) {
                                        let userSale = new db.sales({
                                            state: 'Unpaid',
                                            stripe: {
                                                customerId: user.account.stripeId,
                                                cardInfo: userCard.toObject()
                                            },
                                            amount: finalAmount,
                                            reservation: userReservation
                                        });

                                        return userSale.save();
                                    } else {
                                        return true;
                                    }
                                })
                                .then(sale => {
                                    if (sale === true) {
                                        mailer.confirmReservation(user.email, ctx.state.userReservation);
                                        ctx.status = 200;
                                    } else {
                                        return stripe.chargeSale(sale).then(charge => {
                                            sale.state = charge.status;
                                            return sale.save().then(() => {
                                                if (charge.status == 'failed') {
                                                    ctx.status = 400;
                                                } else {
                                                    mailer.confirmReservation(user.email, ctx.state.userReservation);
                                                    ctx.status = 200;
                                                }
                                            });
                                        })
                                    }
                                });
                        });
                });
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.reservations
                .find({'user.ref': ctx.state.user})
                .exec()
                .then(reservations => {
                    ctx.body = {reservations: reservations.map(entities.reservation)};
                });
        }
    );

// Final price must either be zero or greater than 50cent (stripe limit)
function getDiscount(price, balance) {
    let discount = Math.min(balance, price);
    if (discount < price && discount > price - 50) {
        return price - 50;
    } else {
        return discount;
    }
}
