'use strict';

const router = require('koa-router')();
const auth = require('../auth');
const reportServices = require('../services/report');

module.exports = router;

router.use('/', auth.isPartner)
.get('reservation report', '/reports/reservations',
    ctx => {
        return reportServices.getListHotelReservations(ctx.state.user).then(reservations => {
            ctx.body = reservations;
        });
    });
