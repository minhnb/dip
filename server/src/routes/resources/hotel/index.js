'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');

const offersRouter = require('./offers');

const offerServices = require('../../../services/offer');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

router
    .get('hotel', '/', async (ctx => {
        let hotel = await (ctx.state.hotel.populate('services').execPopulate());
        await (hotel.services.map(function(service) {
            if (!service) return Promise.resolve();
            return offerServices.populateServicePassTypes(service);
        }));
        ctx.body = {hotel: entities.hotel(hotel)};
    }))
    .get('available days for calendar', '/calendar',
        async(ctx => {
            let serviceId = ctx.query.service,
                hotel = ctx.state.hotel,
                date = ctx.query.date;
            ctx.body = await(offerServices.getAvailableDays(hotel, serviceId, date));
        })
    )
    .use('/offers',
        offersRouter.routes(),
        offersRouter.allowedMethods()
    );


module.exports = router;