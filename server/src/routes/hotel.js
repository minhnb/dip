"use strict";

const router = require('koa-router')();
const multer = require('koa-multer');
const auth = require('../helpers/passport_auth');

const utils = require('../helpers/utils');
const resourcesServices = require('../services/resources');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = router;

router
    .use('/', auth.authenticate(), utils.isAdmin)
    .post('create hotel', '/',
        async(ctx => {
            let hotel = ctx.request.body;
            ctx.body = await(resourcesServices.createHotel(hotel));
        })
    )
    .get('get hotel by id', '/:hotelId',
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            ctx.body = await(resourcesServices.getHotelById(hotelId));
        })
    )
    .put('update hotel', '/:hotelId',
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            let hotel = ctx.request.body;
            ctx.body = await(resourcesServices.updateHotel(hotelId, hotel));
        })
    )
    .delete('delete hotel', '/:hotelId',
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            let hotel = await(resourcesServices.deleteHotel(hotelId));
            ctx.status = 200;
        })
    )
    .put('update hotel image', '/:hotelId/image',
        multer().single('image'),
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            let img = ctx.req.file;
            ctx.body = await(resourcesServices.updateHotelImage(hotelId, img));
        })
    );

