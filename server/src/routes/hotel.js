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
    )

    .post('create hotelService', '/:hotelId/service',
        async(ctx => {
            let hotelService = ctx.request.body;
            let hotelId = ctx.params.hotelId;
            ctx.body = await(resourcesServices.createHotelService(hotelId, hotelService));
        })
    )
    .delete('delete hotelService', '/:hotelId/service/:hotelServiceId',
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            let hotelServiceId = ctx.params.hotelServiceId;
            let hotelService = await(resourcesServices.deleteHotelService(hotelId, hotelServiceId));
            ctx.status = 200;
        })
    )
    .get('get hotelService by id', '/service/:hotelServiceId',
        async(ctx => {
            let hotelServiceId = ctx.params.hotelServiceId;
            ctx.body = await(resourcesServices.getHotelServiceById(hotelServiceId));
        })
    )
    .put('update hotelService', '/service/:hotelServiceId',
        async(ctx => {
            let hotelServiceId = ctx.params.hotelServiceId;
            let hotelService = ctx.request.body;
            ctx.body = await(resourcesServices.updateHotelService(hotelServiceId, hotelService));
        })
    )
    .put('update hotel image', '/service/:hotelServiceId/image',
        multer().single('image'),
        async(ctx => {
            let hotelServiceId = ctx.params.hotelServiceId;
            let img = ctx.req.file;
            ctx.body = await(resourcesServices.updateHotelServiceImage(hotelServiceId, img));
        })
    )

    .post('create pass', '/:hotelId/service/:hotelServiceId/pass',
        async(ctx => {
            let pass = ctx.request.body;
            let hotelId = ctx.params.hotelId;
            let hotelServiceId = ctx.params.hotelServiceId;
            ctx.body = await(resourcesServices.createPass(hotelId, hotelServiceId, pass));
        })
    )
    .get('get pass by id', '/pass/:passId',
        async(ctx => {
            let passId = ctx.params.passId;
            ctx.body = await(resourcesServices.getPassById(passId));
        })
    )
    .get('get passes by hotel', '/:hotelId/passes',
        async(ctx => {
            let hotelId = ctx.params.hotelId;
            ctx.body = await(resourcesServices.getPassesByHotel(hotelId));
        })
    );

