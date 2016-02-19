'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var entities = require('../../../entities');
var validator = require('../../../validators');
var utils = require('../../../helpers/utils');

router.get('/', validator.offers(true), function (ctx) {
    // TODO: Add filter for price and duration
    var date = ctx.query.date,
        pool = ctx.state.pool;
    return db.offers.find({
        pool: pool,
        date: utils.convertDate(date)
    }).populate({
        path: 'amenities',
        model: 'Amenity',
        populate: {
            path: 'type',
            model: 'AmenityType'
        }
    }).populate('ticket.ref').exec().then(function (offers) {
        ctx.body = { offers: offers.map(entities.offer) };
    });
});

module.exports = router;