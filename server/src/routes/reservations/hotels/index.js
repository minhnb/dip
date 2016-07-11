"use strict";

const router = require('koa-router')();
const auth = require('../../../helpers/passport_auth');
const reservationServices = require('../../../services/reservation');

module.exports = router;

router
    .use('/', auth.authenticate())
    .post('add reservation', '/',
        reservationServices.createHotelReservation,
        ctx => {
            ctx.status = 200;
        }
    )
    .get('get reservations', '/',
        ctx => {
            return reservationServices.getHotelReservation(ctx.state.user).then(reservations => {
                ctx.body = reservations;
            });
        }
    );