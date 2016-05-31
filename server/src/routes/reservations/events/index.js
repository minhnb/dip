"use strict";

const router = require('koa-router')();

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
        verifyEvent,
        verifyService,
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
                .find({'user.ref': ctx.state.user, type: 'Event'})
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
    if(!ctx.request.body.eventId) ctx.throw(400, 'Missing event id');
    let eventPrice = ctx.request.body.price || ctx.request.body.price === 0;
    if(!eventPrice) ctx.throw(400, 'Missing price');

    let quantities = ctx.request.body.quantities;
    if(!quantities) ctx.throw(400, 'Missing quantities');
    if(quantities < 0) ctx.throw(400, 'quantities must be large then zero');
    ctx.state.quantities = quantities;

    return db.eventReservations.findOne({
        'user.ref': ctx.state.user,
        'event.ref': ctx.request.body.eventId,
        'type': 'Event'
    })
    .exec()
    .then(event => {
        if(!event) return next();
        ctx.throw(400, 'User already join this event');
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
        if(!event) ctx.throw(404, 'Event not found');
        if(expectedPrice !== event.price) ctx.throw(404, 'Unmatched event price');
        if(event.reservationCount + quantities > event.capacity) ctx.throw(400, 'Overbooking event');
        if(event.price > 0) {
            if(!ctx.request.body.cardId) ctx.throw(400, 'Missing cardId');
            let userCardId = ctx.request.body.cardId;
            let userCard = ctx.state.user.account.cards.id(userCardId);
                if (!userCard) {
                    ctx.throw(400, 'Invalid card id');
                }
                if (!userCard.passCvc) {
                    ctx.throw(400, 'Cvc checking failed');
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
        ctx.state.price = event.price * quantities;
        return next();
    })
}

function verifyService(ctx, next) {
    let hostId = ctx.state.event.host._id;
    return db.hotelServices.findOne({_id: hostId})
    .exec()
    .then(service => {
        if(!service) ctx.throw(404, 'Service not found');
        ctx.state.service = service;
        return next();
    })
}

function createReservation(ctx, next) {
    let user = ctx.state.user,
        price = ctx.state.price,
        event  = ctx.state.event,
        service = ctx.state.service,
        quantities = ctx.state.quantities,
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
            price: price
        })

        return db.events.findOne({_id: event._id})
            .exec()
            .then(e => {
                if(e.reservationCount + quantities > e.capacity) ctx.throw(400, 'Overbooking event');
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
                    ctx.throw(400, 'Card charging failed');
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