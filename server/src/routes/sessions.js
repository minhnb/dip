"use strict";
const router = require('koa-router')();
const auth = require('../auth');
const inputValidator = require('../validators');

const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.use('/', auth.authenticate())
    .get('/',
        ctx => {
            let user = ctx.state.user;
            return db.sessions
                .find({user: user})
                .then(sessions => {
                    ctx.status = 200;
                    ctx.body = {sessions: sessions.map(entities.session)};
                });
        }
    )
    .get('/:id',
        ctx => {
            let id = ctx.params.id,
                user = ctx.state.user;
            return db.sessions
                .findOne({user: user})
                .then(session => {
                    ctx.body = {session: entities.session(session)};
                });
        }
    )
    .delete('/:id',
        ctx => {
            let id = ctx.params.id,
                user = ctx.state.user;
            return db.sessions
                .findOneAndRemove({_id: id, user: user})
                .then(session => {
                    ctx.status = 204;
                });
        }
    );