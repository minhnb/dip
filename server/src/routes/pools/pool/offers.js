'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

router.get('/',
    validator.offers(true),
    ctx => {
        // TODO: Add filter for price and duration
        let date = ctx.query.date,
            pool = ctx.state.pool;
        return db.offers.find({
                pool: pool,
                date: utils.convertDate(date)
            })
            .populate('type')
            .populate('amenities')
            .populate('ticket.ref')
            .exec()
            .then(offers => {
                ctx.body = {offers: offers.map(entities.offer)};
            });
    });

module.exports = router;