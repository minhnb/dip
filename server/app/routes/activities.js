"use strict";

var router = require('koa-router')();
var auth = require('../helpers/passport_auth');
var db = require('../db');

var entities = require('../entities');

module.exports = router;

router.get('/', auth.authenticate(['activities']), function (ctx) {
    return db.activities.find().sort({ createdAt: -1 }).limit(25).populate('actor').exec().then(function (data) {
        ctx.body = { activities: data.map(entities.activity) };
    });
});