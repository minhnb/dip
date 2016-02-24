"use strict";
const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const inputValidator = require('../validators');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate())
.put('/:deviceId',
    inputValidator.devices.addDevice(),
    ctx => {
        let deviceId = ctx.params.deviceId,
            token = ctx.request.body.deviceToken,
            details = ctx.request.body.details || {},
            user = ctx.state.user;
        return db.devices
            .findOneAndUpdate({
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
            })
            .exec()
            .then(device => {
                ctx.status = 204;
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