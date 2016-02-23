"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var validator = require('../helpers/input_validator');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate()).put('/', validator({
    request: {
        body: {
            deviceId: validator.required(true),
            deviceToken: validator.required(true),
            details: validator.optional()
        }
    }
}), function (ctx) {
    var deviceInfo = ctx.request.body;
    deviceInfo.user = ctx.state.user;
    var device = new db.devices(deviceInfo);
    return device.save().then(function (device) {
        ctx.status = 204;
        // TODO: Register device for sending message/notification
    }).catch(function (err) {
        ctx.status = 400;
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
}).post('/:deviceId', function (ctx) {
    var deviceId = ctx.params.deviceId,
        token = ctx.request.body.deviceToken,
        user = ctx.state.user;
    return db.devices.findOneAndUpdate({
        deviceId: deviceId,
        user: user
    }, {
        $set: { deviceToken: token }
    }, { 'new': true }).exec().then(function (device) {
        ctx.status = 204;
    });
}).delete('/:id', function (ctx) {
    var id = ctx.params.id,
        user = ctx.state.user;
    return db.devices.findOneAndRemove({ deviceId: id, user: user }).then(function (device) {
        ctx.status = 204;
    });
});