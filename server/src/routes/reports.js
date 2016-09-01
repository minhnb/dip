'use strict';

const router = require('koa-router')();
const auth = require('../auth');
const utils = require('../helpers/utils');
const reportServices = require('../services/report');

module.exports = router;

router.use('/', auth.isPartnerOrAdmin)
    .get('hotel reservation report', '/reservations/hotels',
        ctx => {
            return reportServices.getListHotelReservations(ctx.state.user).then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('event reservation report', '/reservations/events',
        utils.isAdmin,
        ctx => {
            return reportServices.getListEventReservations().then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('users report', '/users',
        utils.isAdmin,
        ctx => {
            return reportServices.getListDIPUsers().then(users => {
                ctx.body = users;
            });
        }
    );