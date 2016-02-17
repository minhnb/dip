"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var db = require('../db');
var entities = require('../entities');

module.exports = router;

router.get('/', auth.authenticate(), function (ctx) {
    return db.announcements.all().sort({ updatedAt: 1 }).exec().then(function (data) {
        ctx.body = { announcements: data.map(entities.announcement) };
    });
});