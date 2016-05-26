'use strict';

const router = require('koa-router')();
const mongoose = require('mongoose');
const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

router.get('/',
    validator.offers(true),
    ctx => {
        // TODO: Add filter for price and duration
        let date = ctx.query.date,
            service = ctx.query.service;
        return db.offers.find({
                service: mongoose.Types.ObjectId(service),
                date: utils.convertDate(date)
            })
            .populate('type')
            .populate('addons')
            .exec()
            .then(offers => {
                ctx.body = {offers: offers.map(entities.offer)};
            });
    });

module.exports = router;
