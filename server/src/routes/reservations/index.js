"use strict";
const router = require('koa-router')();
const events = require('./events');
const specialOffers = require('./specialOffers');
const hotels = require('./hotels');

const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');

module.exports = router;

router
    .use('/', auth.authenticate())
    .use('/events',
        events.routes(),
        events.allowedMethods()
    )
    .use('/offers',
        specialOffers.routes(),
        specialOffers.allowedMethods()
    )
    .use('/hotels',
        hotels.routes(),
        hotels.allowedMethods()
    )
    .get('get reservations', '/',
        ctx => {
        	let responseData = {};
            let getEventReservation = db.reservations
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
            		responseData.events = reservations.map(entities.eventReservation);
            		return;
            	})
            let getSpecialOfferReservation = db.reservations
                .find({'user.ref': ctx.state.user, type: 'SpecialOffer'})    
                .populate({
                    path: 'specialOffer.ref',
                    model: db.specialOffers
                })
                .populate({
                    path: 'offers.ref',
                    model: db.offers
                })
                .exec()
                .then(reservations => {
                    responseData.specialOffers = reservations.map(entities.specialOfferReservation);
                    return;
                })
            let getHotelReservation = db.reservations
                .find({'user.ref': ctx.state.user, type: 'Hotel'})  
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
                    responseData.hotels = reservations.map(entities.hotelReservation);
                    return;
                })

            return Promise.all([getHotelReservation, getEventReservation, getSpecialOfferReservation]).then(() => {
            	ctx.body = responseData;
            })
        }
    );