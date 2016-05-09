"use strict";
const router = require('koa-router')();
const pools = require('./pools');
const events = require('./events');
const specialOffers = require('./specialOffers');

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');

module.exports = router;

router
    .use('/', auth.authenticate())
    .use('/pools',
        pools.routes(),
        pools.allowedMethods()
    )
    .use('/events',
        events.routes(),
        events.allowedMethods()
    )
    .use('/offers',
        specialOffers.routes(),
        specialOffers.allowedMethods()
    )
    .get('get reservations', '/',
        ctx => {
        	let responseData = {};
        	let getPoolReservations = db.reservations
                .find({'user.ref': ctx.state.user, type: 'Pool'})
                .populate({
                    path: 'offers.members',
                    model: db.users
                })
                .exec()
                .then(reservations => {
                	responseData.pools = reservations.map(entities.reservation);
                    return;
                });

            let getEventReservation = db.reservations
            	.find({'user.ref': ctx.state.user, type: 'Event'})    
            	.populate({
                    path: 'event.ref',
                    model: db.events,
                    populate: {
                        path: 'pool',
                        model: db.pools
                    }
                })
            	.exec()
            	.then(reservations => {
            		responseData.events = reservations.map(entities.eventReservation);
            		return;
            	})
            let getSpecialOfferReservation = db.reservations
                .find({'user.ref': ctx.state.user, type: 'SpecialOffer'})    
                .exec()
                .then(reservations => {
                    responseData.specialOffers = reservations.map(entities.specialOfferReservation);
                    return;
                })

            return Promise.all([getPoolReservations, getEventReservation, getSpecialOfferReservation]).then(() => {
            	ctx.body = responseData;
            })
        }
    );