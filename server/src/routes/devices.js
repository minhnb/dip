"use strict";
const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const validator = require('../helpers/input_validator');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate())
.put('/',
    validator({
        request: {
            body: {
                deviceId: validator.required(true),
                deviceToken: validator.required(true),
                details: validator.optional()
            }
        }
    }),
    ctx => {
        var deviceInfo = ctx.request.body;
        deviceInfo.user = ctx.state.user;
        var device = new db.devices(deviceInfo);
        return device.save().then(device => {
            ctx.status = 204;
            // TODO: Register device for sending message/notification
        }).catch(err => {
            ctx.status = 400;
        });
    }
)
.get('/',
    ctx => {
        let user = ctx.state.user;
        return db.devices
            .find({user: user})
            .then(devices => {
                ctx.body = {devices: devices.map(entities.device)};
            });
    }
)
.get('/:id',
    ctx => {
        let id = ctx.params.id,
            user = ctx.state.user;
        return db.devices
            .findOne({deviceId: id, user: user})
            .then(device => {
                ctx.body = {device: entities.device(device)};
            });
    }
)
.post('/:deviceId',
    ctx => {
        let deviceId = ctx.params.deviceId,
            token = ctx.request.body.deviceToken,
            user = ctx.state.user;
        return db.devices
            .findOneAndUpdate({
                deviceId: deviceId,
                user: user
            }, {
                $set: {deviceToken: token}
            }, {'new': true})
            .exec()
            .then(device => {
                ctx.status = 204;
            });
    }
)
.delete('/:id',
    ctx => {
        let id = ctx.params.id,
            user = ctx.state.user;
        return db.devices
            .findOneAndRemove({deviceId: id, user: user})
            .then(device => {
                ctx.status = 204;
            });
    }
);