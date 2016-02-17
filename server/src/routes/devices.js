"use strict";
const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const validator = require('../helpers/input_validator');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.post('/',
    auth.authenticate(),
    validator({
        request: {
            body: {
                deviceId: validator.isAlphanumeric(),
                deviceToken: validator.isAlphanumeric(),
                apnsEnvironment: validator.isIn(['production', 'staging', 'development']),
                details: validator.isJSON()
            }
        }
    }),
    ctx => {
        var deviceInfo = ctx.request.body;
        var device = new db.devices(deviceInfo);
        return device.save().then(device => {
            ctx.status = 204;
            // TODO: Register device for sending message/notification
        }).catch(err => {
            ctx.status = 400;
        });
    }
);