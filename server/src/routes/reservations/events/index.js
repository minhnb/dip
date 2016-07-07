"use strict";

const router = require('koa-router')();

const db = require('../../../db');
const inputValidator = require('../../../validators');
const entities = require('../../../entities');
const mailer = require('../../../mailer');
const stripe = require('../../../helpers/stripe');
const config = require('../../../config');

const auth = require('../../../helpers/passport_auth');

const dipErrorDictionary = require('../../../constants/dipErrorDictionary');
const DIPError = require('../../../helpers/DIPError');

const makerEvent = require('../../../helpers/iftttMakerEvent');

module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        validateInput,
        verifyEvent,
        verifyService,
        createReservation,
        createSale,
        chargeSale,
        // sendEmail,
        updateGoogleSpreadsheet,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return db.reservations
                .find({'user.ref': ctx.state.user, type: 'EventReservation'})
                .populate({
                    path: 'event.ref',
                    model: db.events,
                    populate: {
                        path: 'host',
                        model: db.hotelServices
                    }
                })
                .exec()
                .then(reservations => {
                    ctx.body = {reservations: reservations.map(entities.eventReservation)};
                });
        }
    );

function validateInput(ctx, next) {
    if(!ctx.request.body.eventId) {
        // ctx.throw(400, 'Missing event id');
        throw new DIPError(dipErrorDictionary.MISSING_EVENT);
    }
    let eventPrice = ctx.request.body.price || ctx.request.body.price === 0;
    if(!eventPrice) {
        // ctx.throw(400, 'Missing price');
        throw new DIPError(dipErrorDictionary.MISSING_PRICE);
    }

    let quantities = ctx.request.body.quantities;
    if(!quantities) {
        // ctx.throw(400, 'Missing quantities');
        throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
    }
    if(quantities < 0) {
        // ctx.throw(400, 'quantities must be large then zero');
        throw new DIPError(dipErrorDictionary.INVALID_QUANTITIES);
    }
    ctx.state.quantities = quantities;

    return db.eventReservations.findOne({
        'user.ref': ctx.state.user,
        'event.ref': ctx.request.body.eventId,
        'type': 'EventReservation'
    })
    .exec()
    .then(event => {
        if(!event) return next();
        // ctx.throw(400, 'User already join this event');
        throw new DIPError(dipErrorDictionary.USER_ALREADY_JOIN_EVENT);
    })
}

function verifyEvent(ctx, next) {
    let eventId = ctx.request.body.eventId;
    let expectedPrice = ctx.request.body.price;
    let quantities = ctx.state.quantities;
    return db.events.findOne({_id: eventId})
    .populate('host')
    .exec()
    .then(event => {
        if(!event) {
            // ctx.throw(404, 'Event not found');
            throw new DIPError(dipErrorDictionary.EVENT_NOT_FOUND);
        }
        if(expectedPrice !== event.price) {
            // ctx.throw(404, 'Unmatched event price');
            throw new DIPError(dipErrorDictionary.UNMATCHED_EVENT_PRICE);
        }
        if(event.reservationCount + quantities > event.capacity) {
            // ctx.throw(400, 'Overbooking event');
            throw new DIPError(dipErrorDictionary.EVENT_OVERBOOKING);
        }
        if(event.price > 0) {
            if(!ctx.request.body.cardId) {
                // ctx.throw(400, 'Missing cardId');
                throw new DIPError(dipErrorDictionary.INVALID_CARD_ID);
            }
            let userCardId = ctx.request.body.cardId;
            let userCard = ctx.state.user.account.cards.id(userCardId);
                if (!userCard) {
                    // ctx.throw(400, 'Invalid card id');
                    throw new DIPError(dipErrorDictionary.INVALID_CARD_ID);
                }
                if (!userCard.passCvc) {
                    // ctx.throw(400, 'Cvc checking failed');
                    throw new DIPError(dipErrorDictionary.CVC_CHECKING_FAILED);
                }
                ctx.state.userCard = userCard;
                //validate friend
                // if(ctx.request.body.members) {
                //     let friendSet = new Set(ctx.state.user.friends.map(f => f.toString()));
                //     if (ctx.request.body.members && !Array.isArray(ctx.request.body.members) && ctx.request.body.members.length > 0) {
                //         ctx.throw(400, 'Invites must be a list');
                //     }
                //     if (!ctx.request.body.members) {
                //         ctx.request.body.members = [];
                //     }
                //     ctx.request.body.members.forEach(i => {
                //         if (!friendSet.has(i) && !ctx.state.user._id.equals(i)) {
                //             ctx.throw(400, 'Invitee must be a friend');
                //         }
                //     });

                //     return db.events.find({members: {$in: ctx.request.body.members}})
                //     .populate('members')
                //     .exec()
                //     .then(members => {
                //         if(members.length > 0) {
                //             let joinedMembers = [];
                //             for(let i = 0; i < members.length; i++) {
                //                 joinedMembers.push(members[i].firstName);
                //             }
                //             ctx.throw(400, joinedMembers.toString() + ' has joined this event');
                //         } else {
                //             ctx.state.members = ctx.request.body.members;
                //         }
                //     })
                // }    
        }
        ctx.state.event = event;
        ctx.state.beforeTax = event.price * quantities;
        return next();
    })
}

function verifyService(ctx, next) {
    let hostId = ctx.state.event.host._id;
    return db.hotelServices.findOne({_id: hostId})
    .exec()
    .then(service => {
        if(!service) {
            // ctx.throw(404, 'Service not found');
            throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);
        }
        ctx.state.service = service;
        return next();
    })
}

function createReservation(ctx, next) {
    let user = ctx.state.user,
        event  = ctx.state.event,
        service = ctx.state.service,
        quantities = ctx.state.quantities,
        taxPercent = config.taxPercent,
        beforeTax = ctx.state.beforeTax;

    ctx.state.tax = Math.round(taxPercent * ctx.state.beforeTax / 100);
    ctx.state.price = ctx.state.tax + ctx.state.beforeTax;

    let price = ctx.state.price,
        tax = ctx.state.tax,
        eventReservation = new db.eventReservations({
            user: {
                ref: user,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            event: {
                ref: event,
                title: event.title
            },
            count: quantities,
            price: price,
            tax: tax,
            beforeTax: beforeTax
        })

        return db.events.findOne({_id: event._id})
            .exec()
            .then(e => {
                if(e.reservationCount + quantities > e.capacity) {
                    // ctx.throw(400, 'Overbooking event');
                    throw new DIPError(dipErrorDictionary.EVENT_OVERBOOKING);
                }
                e.reservationCount += quantities;
                e.members.addToSet(user);
                return e.save();
            })
            .then(() => {
                let p = Promise.resolve();
                if (user.account.balance > 0 && price > 0) {
                    let discount = getDiscount(price, user.account.balance);
                    user.account.balance -= discount;
                    eventReservation.promotionDiscount = discount;
                    p = user.save();
                }
                ctx.state.eventReservation = eventReservation;
                return p.then(() => {
                    return eventReservation.save()   
                })
                .then(next);
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

function createSale(ctx, next) {
    let user = ctx.state.user,
        userCard = ctx.state.userCard,
        discount = ctx.state.eventReservation.promotionDiscount || 0,
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
            reservation: ctx.state.eventReservation
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

function sendEmail(ctx, next) {
    mailer.confirmEventReservation(ctx.state.user.email, ctx.state.event);
    return next();
}

function updateGoogleSpreadsheet(ctx, next) {
    let user = ctx.state.user,
        event = ctx.state.event;
    return makerEvent.dipEventReservation({
        value1: user.nameOrEmail,
        value2: user.email,
        value3: event.title
    }).then(() => next());
}