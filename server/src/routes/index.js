"use strict";

const router = require('koa-router')();

module.exports = router;

const activities = require('./activities');
const announcements = require('./announcements');
const promotions = require('./promotions');
const devices = require('./devices');
const pools = require('./pools');
const reservations = require('./reservations');
const sales = require('./sales');
const users = require('./users');
const groups = require('./groups');

const resetPassword = require('./resetPassword');
const wishLists = require('./wishLists');
const auth = require('./auth');

router.get('index page', '/', ctx => {
    ctx.render('index', {
        title: 'Hello World Koa!'
    });
});

router.use('/activities', activities.routes(), activities.allowedMethods());
router.use('/announcements', announcements.routes(), announcements.allowedMethods());
router.use('/promotions', promotions.routes(), promotions.allowedMethods());
router.use('/devices', devices.routes(), devices.allowedMethods());
router.use('/pools', pools.routes(), pools.allowedMethods());
router.use('/reservations', reservations.routes(), reservations.allowedMethods());
router.use('/sales', sales.routes(), sales.allowedMethods());
router.use('/users', users.routes(), users.allowedMethods());
router.use('/groups', groups.routes(), groups.allowedMethods());

router.use('/resetpassword', resetPassword.routes(), resetPassword.allowedMethods());
router.use('/auth', auth.routes(), auth.allowedMethods());
router.use('/wishlists', wishLists.routes(), wishLists.allowedMethods());
