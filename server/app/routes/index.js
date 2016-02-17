"use strict";

var router = require('koa-router')();

module.exports = router;

var activities = require('./activities');
var announcements = require('./announcements');
var coupons = require('./coupons');
var devices = require('./devices');
var pools = require('./pools');
var reservations = require('./reservations');
var sales = require('./sales');
var users = require('./users');

var auth = require('./auth');

router.get('index page', '/', function (ctx) {
    ctx.render('index', {
        title: 'Hello World Koa!'
    });
});

router.use('/activities', activities.routes(), activities.allowedMethods());
router.use('/announcements', announcements.routes(), announcements.allowedMethods());
router.use('/coupons', coupons.routes(), coupons.allowedMethods());
router.use('/devices', devices.routes(), devices.allowedMethods());
router.use('/pools', pools.routes(), pools.allowedMethods());
router.use('/reservations', reservations.routes(), reservations.allowedMethods());
router.use('/sales', sales.routes(), sales.allowedMethods());
router.use('/users', users.routes(), users.allowedMethods());

router.use('/auth', auth.routes(), auth.allowedMethods());