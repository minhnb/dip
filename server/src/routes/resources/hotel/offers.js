'use strict';

const router = require('koa-router')();
const mongoose = require('mongoose');
const moment = require('moment');
const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

router.get('/',
    validator.offers(true),
    ctx => {
        // TODO: Add filter for price and duration
        let date = ctx.query.date,
            service = ctx.query.service,
            day = moment(date).weekday();

        return db.offers.find({
                service: mongoose.Types.ObjectId(service),
                days: day,
                dueDay: {$gte: date},
                startDay: {$lte: date},
                type: 'pass'
            })
            .populate('type')
            .populate('addons')
            .exec()
            .then(offers => {
                offers.forEach(offer => {
                    offer.date = date
                });
                ctx.body = {offers: offers.map(entities.offer)};
            });
    });

module.exports = router;
