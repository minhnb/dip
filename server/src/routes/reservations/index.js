"use strict";
const router = require('koa-router')();
const pools = require('./pools');
const events = require('./events');

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
    .get('get reservations', '/',
        ctx => {
        	let responseData = {};
        	let getPoolReservations = db.reservations
                .find({'user.ref': ctx.state.user, type: 'Pool'})
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
                	responseData.pools = reservations.map(entities.reservation);
                    return;
                });

            let getEventReservation = db.reservations
            	.find({'user.ref': ctx.state.user, type: 'Event'})    
            	.populate({
                    path: 'event.ref',
                    model: db.events
                })
                .populate('pool.ref')
            	.exec()
            	.then(reservations => {
            		responseData.events = reservations.map(entities.eventReservation);
            		return;
            	})

            return Promise.all([getPoolReservations, getEventReservation]).then(() => {
            	ctx.body = responseData;
            })
        }
    );