"use strict";

const router = require('koa-router')();
const auth = require('../auth');
const utils = require('../helpers/utils');
const adminServices = require('../services/admin');
const reportServices = require('../services/report');

module.exports = router;

router
    .use('/', auth.authenticate(), utils.isAdmin)
    .post('update app context', '/appcontext/update',
        ctx => {
            ctx.status = 200;
            adminServices.updateAppContext(ctx.app.context);
        }
    )
    .get('event reservation report', '/reports/reservations/hotels',
        ctx => {
            return reportServices.getListHotelReservations(ctx.state.user).then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('hotel reservation report', '/reports/reservations/events',
        ctx => {
            return reportServices.getListEventReservations(ctx.state.user).then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('users report', '/reports/users',
        ctx => {
            return reportServices.getListDIPUsers().then(users => {
                ctx.body = users;
            });
        }
    );