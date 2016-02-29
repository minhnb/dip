"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var inputValidator = require('../validators');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate()).put('/:deviceId', // Add/Replace device for current session
inputValidator.devices.addDevice(), function (ctx) {
    var deviceId = ctx.params.deviceId,
        token = ctx.request.body.deviceToken,
        details = ctx.request.body.details || {},
        session = ctx.state.session;

    session.device = {
        deviceId: deviceId,
        deviceToken: token,
        details: details
    };

    return session.save().then(function (session) {
        ctx.status = 204;
    });
}).get('/', function (ctx) {
    var user = ctx.state.user;
    return db.sessions.find({ user: user }).then(function (sessions) {
        var devices = sessions.reduce(function (arr, session) {
            if (session.device) {
                arr.push(session.device);
            }
            return arr;
        }, []);
        ctx.status = 200;
        ctx.body = { devices: devices.map(entities.device) };
    });
}).get('/:id', function (ctx) {
    var id = ctx.params.id,
        user = ctx.state.user;
    return db.sessions.findOne({ user: user, 'device.deviceId': id }).then(function (session) {
        ctx.body = { device: entities.device(session.device) };
    });
});