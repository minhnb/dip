"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var validator = require('../helpers/input_validator');

var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.post('/', auth.authenticate(), validator({
    request: {
        body: {
            deviceId: validator.isAlphanumeric(),
            deviceToken: validator.isAlphanumeric(),
            apnsEnvironment: validator.isIn(['production', 'staging', 'development']),
            details: validator.isJSON()
        }
    }
}), function (ctx) {
    var deviceInfo = ctx.request.body;
    var device = new db.devices(deviceInfo);
    return device.save().then(function (device) {
        ctx.status = 204;
        // TODO: Register device for sending message/notification
    }).catch(function (err) {
        ctx.status = 400;
    });
});