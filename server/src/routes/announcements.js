"use strict";
const router = require('koa-router')();
const auth = require('../helpers/passport_auth');
const db = require('../db');
const entities = require('../entities');

module.exports = router;

router.get('/',
    auth.authenticate(),
    ctx => {
        return db.announcements.all().sort({updatedAt: 1}).exec().then(function(data) {
            ctx.body = {announcements: data.map(entities.announcement)};
        });
    }
);