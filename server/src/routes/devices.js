"use strict";
const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const inputValidator = require('../validators');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate())
.put('/:deviceId', // Add/Replace device for current session
    inputValidator.devices.addDevice(),
    ctx => {
        let deviceId = ctx.params.deviceId,
            token = ctx.request.body.deviceToken,
            details = ctx.request.body.details || {},
            session = ctx.state.session;

        session.device = {
            deviceId: deviceId,
            deviceToken: token,
            details: details,
            receiveNotification: true
        };

        return session.save().then(session => {
            ctx.status = 204;
        });
    }
)
.get('/',
    ctx => {
        let user = ctx.state.user;
        return db.sessions
            .find({user: user})
            .exec()
            .then(sessions => {
                let devices = sessions.reduce((arr, session) => {
                    if (session.device) {
                        arr.push(session.device);
                    }
                    return arr;
                }, []);
                ctx.status = 200;
                ctx.body = {devices: devices.map(entities.device)};
            });
    }
)
.get('/:id',
    ctx => {
        let id = ctx.params.id,
            user = ctx.state.user;
        return db.sessions
            .findOne({user: user, 'device.deviceId': id})
            .then(session => {
                ctx.body = {device: entities.device(session.device)};
            });
    }
);