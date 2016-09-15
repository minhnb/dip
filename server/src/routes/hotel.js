"use strict";

const router = require('koa-router')();
const multer = require('koa-multer');
const auth = require('../auth');

const utils = require('../helpers/utils');
const resourcesServices = require('../services/resources');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

module.exports = router;

router
    .use('/', auth.isPartnerOrAdmin)
    .post('create hotel', '/',
        async(ctx => {
            let user = ctx.state.user;
            let hotel = ctx.request.body;
            ctx.body = await(resourcesServices.createHotel(user, hotel));
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
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let hotel = ctx.request.body;
            ctx.body = await(resourcesServices.updateHotel(user, hotelId, hotel));
        })
    )
    .put('update hotel status', '/:hotelId/status',
        auth.isAdmin,
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId,
                active = ctx.request.body.active,
                status = ctx.request.body.submission.status;
            let hotel = await(resourcesServices.updateHotelStatus(user, hotelId, active, status));
            ctx.status = 200;
        })
    )
    .put('submit hotel', '/:hotelId/submit',
        auth.isPartner,
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let hotel = await(resourcesServices.submitHotel(user, hotelId));
            ctx.status = 200;
        })
    )
    .put('approve hotel', '/:hotelId/approve',
        auth.isAdmin,
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let hotel = await(resourcesServices.approveHotel(user, hotelId));
            ctx.status = 200;
        })
    )
    .put('decline hotel', '/:hotelId/decline',
        auth.isAdmin,
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId,
                failReason = ctx.request.body.submission ? ctx.request.body.submission.failReason : undefined;
            let hotel = await(resourcesServices.declineHotel(user, hotelId, failReason));
            ctx.status = 200;
        })
    )
    .delete('delete hotel', '/:hotelId',
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let hotel = await(resourcesServices.deleteHotel(user, hotelId));
            ctx.status = 200;
        })
    )
    .put('update hotel image', '/:hotelId/image',
        multer().single('image'),
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let img = ctx.req.file;
            ctx.body = await(resourcesServices.updateHotelImage(user, hotelId, img));
        })
    )

    .post('create hotelService', '/:hotelId/service',
        async(ctx => {
            let user = ctx.state.user,
                hotelService = ctx.request.body;
            let hotelId = ctx.params.hotelId;
            ctx.body = await(resourcesServices.createHotelService(user, hotelId, hotelService));
        })
    )
    .delete('delete hotelService', '/:hotelId/service/:hotelServiceId',
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            let hotelServiceId = ctx.params.hotelServiceId;
            let hotelService = await(resourcesServices.deleteHotelService(user, hotelId, hotelServiceId));
            ctx.status = 200;
        })
    )
    .get('get hotelService by id', '/service/:hotelServiceId',
        async(ctx => {
            let hotelServiceId = ctx.params.hotelServiceId;
            ctx.body = await(resourcesServices.getHotelServiceById(hotelServiceId));
        })
    )
    .put('update hotelService', '/:hotelId/service/:hotelServiceId',
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId,
                hotelServiceId = ctx.params.hotelServiceId;
            let hotelService = ctx.request.body;
            ctx.body = await(resourcesServices.updateHotelService(user, hotelId, hotelServiceId, hotelService));
        })
    )
    .put('update hotel image', '/:hotelId/service/:hotelServiceId/image',
        multer().single('image'),
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId,
                hotelServiceId = ctx.params.hotelServiceId;
            let img = ctx.req.file;
            ctx.body = await(resourcesServices.updateHotelServiceImage(user, hotelId, hotelServiceId, img));
        })
    )

    .post('create pass', '/:hotelId/service/:hotelServiceId/pass',
        async(ctx => {
            let pass = ctx.request.body;
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId,
                hotelServiceId = ctx.params.hotelServiceId;
            ctx.body = await(resourcesServices.createPass(user, hotelId, hotelServiceId, pass));
        })
    )
    .get('get pass by id', '/pass/:passId',
        async(ctx => {
            let passId = ctx.params.passId;
            ctx.body = await(resourcesServices.getPassById(passId));
        })
    )
    .put('update pass', '/pass/:passId',
        async(ctx => {
            let user = ctx.state.user,
                passId = ctx.params.passId;
            let pass = ctx.request.body;
            ctx.body = await(resourcesServices.updatePass(user, passId, pass));
        })
    )
    .delete('delete pass', '/pass/:passId',
        async(ctx => {
            let user = ctx.state.user,
                passId = ctx.params.passId;
            let pass = await(resourcesServices.deletePass(user, passId));
            ctx.status = 200;
        })
    )
    .get('get passes by hotel', '/:hotelId/passes',
        async(ctx => {
            let user = ctx.state.user,
                hotelId = ctx.params.hotelId;
            ctx.body = await(resourcesServices.getPassesByHotel(hotelId));
        })
    );

