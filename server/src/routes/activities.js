"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');
const db = require('../db');

const entities = require('../entities');

module.exports = router;

router.get('/',
    auth.authenticate(['activities']),
    ctx => {
        return db.activities.find().sort({createdAt: -1}).limit(25)
            .populate('actor')
            .exec().then(function(data) {
            ctx.body = {activities: data.map(entities.activity)};
        });
    }
);
