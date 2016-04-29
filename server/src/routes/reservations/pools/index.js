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
        inputValidator.reservations.addReservation(),
        checkInput,
        getPool,
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
            return db.poolReservations
                .find({'user.ref': ctx.state.user, type: 'Pools'})
                .populate({
                    path: 'offers.details.specialOffers',
                    model: db.specialOffers
                })
                .populate({
                    path: 'offers.members',
                    model: db.users
                })
                .populate({
                    path: 'offers.details.type',
                    model: db.offers
                })
                .exec()
                .then(reservations => {
                    ctx.body = {reservations: reservations.map(entities.reservation)};
                });
        }
    );

function checkInput(ctx, next) {
    let user = ctx.state.user,
        _offers = ctx.request.body.offers,
        userCardId = ctx.request.body.cardId;

    let friendSet = new Set(user.friends.map(f => f.toString()));

    _offers.forEach(i => {
        if (i.members && !Array.isArray(i.members)) {
            ctx.throw(400, 'Invites must be a list');
        }
        if (!i.members) {
            i.members = [];
        }
        i.members.forEach(j => {
            if (!friendSet.has(j) && !user._id.equals(j)) {
                ctx.throw(400, 'Invitee must be a friend');
            }
        })
    });

    let userCard = user.account.cards.id(userCardId);
    if (!userCard) {
        ctx.throw(400, 'Invalid card id');
    }
    if (!userCard.passCvc) {
        ctx.throw(400, 'Cvc checking failed');
    }

    ctx.state.friendSet = friendSet;
    ctx.state.userCard = userCard;
    return next();
}

function getPool(ctx, next) {
    return db.pools.findById(ctx.request.body.pool)
    .exec()
    .then(pool => {
        if (!pool) {
            ctx.throw(400, 'Invalid pool');
        }
        ctx.state.pool = pool;
        return next();
    });
}

function verifyOffers(ctx, next) {
    let _offers = ctx.request.body.offers,
        expectedPrice = ctx.request.body.price;

    let offerIds = _offers.map(o => o.id);

    return db.offers.find({
        _id: {$in: offerIds},
        pool: ctx.state.pool
    })
    .populate('specialOffers')
    .exec()
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

            if (!verifySpecialOffers(expected, offer)) {
                ctx.throw(400, 'Invalid special offer');
            }
            let specialOfferPrice = expected.specialOffers.reduce((total, sOffer) => {
                return total + sOffer.price * sOffer.count;
            }, 0);
            //if(expected.specialOffers && expected.specialOffers.length > 0) {
            //    expected.specialOffers.forEach(s => {
            //        offer.specialOffers.map(o => {
            //            if(s.id == o.id && s.price == o.price) {
            //                specialOfferPrice += (o.price * s.count);
            //            } else if(s.id == o.type && s.price != o.price){
            //                ctx.throw(400, 'Unmatched special offer price');
            //            }
            //        })
            //    });
            //}
            price += expected.count * offer.ticket.price;
            price += specialOfferPrice;
        });

        if (price != expectedPrice) {
            ctx.throw(400, 'Unmatched total price');
        }

        ctx.state.price = price;
        ctx.state.offers = offers;
        ctx.state.offerMap = offerMap;
        return Promise.all(offers.map(o => o.save())).then(next);
    });
}

function verifySpecialOffers(userOffer, offer) {
    if(userOffer.specialOffers) {
        let length = userOffer.specialOffers.length;
        let specialOffersMap = offer.specialOffers.reduce((obj, sOffer) => {
            obj[sOffer.id] = sOffer;
            return obj;
        }, Object.create({}));
        for (let i = 0; i < length; i++) {
            let userSubOffer = userOffer.specialOffers[i];
            let subOffer = specialOffersMap[userSubOffer.id];
            if (!subOffer || subOffer.price != userSubOffer.price
                || isNaN(userSubOffer.count) || (userSubOffer.count !== parseInt(userSubOffer.count, 10))
                || userSubOffer.count <= 0) {
                return false;
            }
        }
        offer.specialOffersMap = specialOffersMap;
    } else {
        userOffer.specialOffers = [];
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
        pool = ctx.state.pool,
        price = ctx.state.price,
        offers = ctx.state.offers,
        offerMap = ctx.state.offerMap,
        userReservation = new db.poolReservations({
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
                let userOffer = offerMap[o.id],
                    specialOffers = [];
                if(userOffer.specialOffers) {
                    specialOffers = userOffer.specialOffers.reduce((arr, userSubOffer) => {
                        arr.push({
                            ref: userSubOffer.id,
                            details: o.specialOffersMap[userSubOffer.id].toObject(),
                            count: userSubOffer.count
                        });
                        return arr;
                    }, []);
                }

                o.depopulate('specialOffers');
                return {
                    ref: o._id,
                    details: o.toObject(),
                    members: userOffer.members,
                    count: userOffer.count,
                    specialOffers: specialOffers
                };
            })
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
    return populateMembers(ctx, () => {
        let user = ctx.state.user;

        if (ctx.state.memberMap !== {}) {
            ctx.state.memberArr.forEach(i => {
                ctx.state.memberMap[i._id].name = i.firstName;
                ctx.state.memberMap[i._id].owner = ctx.state.user;
                mailer.inviteFriendsReservation(i.email, ctx.state.memberMap[i._id]);
            });
        }
        mailer.confirmReservation(user.email, ctx.state.reservation);

        return next();
    });
}

function populateMembers(ctx, next) {
    let user = ctx.state.user,
        userReservation = ctx.state.reservation;
    let memberMap = {};
    userReservation.offers.forEach(offer => {
        offer.members.forEach(member => {
            if (!memberMap[member] && !user._id.equals(member)) {
                memberMap[member] = {
                    offers: [],
                    pool: {},
                    name: '',
                    owner: {}
                };
            }
            if (memberMap[member]) {
                memberMap[member].offers.push(offer);
                memberMap[member].pool = userReservation.pool;
            }
        })
    });

    var memberArr = Object.keys(memberMap);
    ctx.state.memberMap = memberMap;
    return db.users.find({
        _id: {$in: memberArr}
    }).exec()
        .then(users => {
            ctx.state.memberArr = users;
        }).then(next);
}