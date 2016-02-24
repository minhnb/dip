"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var inputValidator = require('../validators');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate()).put('/:deviceId', inputValidator.devices.addDevice(), function (ctx) {
    var deviceId = ctx.params.deviceId,
        token = ctx.request.body.deviceToken,
        details = ctx.request.body.details || {},
        user = ctx.state.user;
    return db.devices.findOneAndUpdate({
        deviceId: deviceId,
        user: user
    }, {
        deviceId: deviceId,
        user: user._id,
        deviceToken: token,
        details: details
    }, {
        'new': true,
        upsert: true
    }).exec().then(function (device) {
        ctx.status = 204;
    });
}).get('/', function (ctx) {
    var user = ctx.state.user;
    return db.devices.find({ user: user }).then(function (devices) {
        ctx.body = { devices: devices.map(entities.device) };
    });
}).get('/:id', function (ctx) {
    var id = ctx.params.id,
        user = ctx.state.user;
    return db.devices.findOne({ deviceId: id, user: user }).then(function (device) {
        ctx.body = { device: entities.device(device) };
    });
}).delete('/:id', function (ctx) {
    var id = ctx.params.id,
        user = ctx.state.user;
    return db.devices.findOneAndRemove({ deviceId: id, user: user }).then(function (device) {
        ctx.status = 204;
    });
});