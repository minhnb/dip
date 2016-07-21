"use strict";

const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
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
    .get('event reservation report', '/report/reservation/hotels',
        ctx => {
            return reportServices.getListHotelReservations().then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('hotel reservation report', '/report/reservation/events',
        ctx => {
            return reportServices.getListEventReservations().then(reservations => {
                ctx.body = reservations;
            });
        }
    )
    .get('users report', '/report/users',
        ctx => {
            return reportServices.getListDIPUsers().then(users => {
                ctx.body = users;
            });
        }
    );