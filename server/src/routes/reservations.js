"use strict";

const router = require('koa-router')();

const db = require('../db');
const entities = require('../entities');
const inputValidator = require('../validators');

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
                expectedPrice = ctx.request.body.price;

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
                                        })
                                    });
                                    return userReservation.save();
                                })
                                .then(userReservation => {
                                    let userSale = new db.sales({
                                        state: 'Unpaid',
                                        stripe: {
                                            customerId: user.account.stripeId,
                                            cardInfo: userCard.toObject()
                                        },
                                        amount: price,
                                        reservation: userReservation
                                    });

                                    return userSale.save();
                                })
                                .then(sale => {
                                    return stripe.chargeSale(sale).then(charge => {
                                        sale.state = charge.status;
                                        return sale.save().then(() => {
                                            if (charge.status == 'failed') {
                                                ctx.status = 400;
                                            } else {
                                                ctx.status = 200;
                                            }
                                        });
                                    })
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