'use strict';

const router = require('koa-router')();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

router.get('/',
    validator.offers(true),
    ctx => {
        // TODO: Add filter for price and duration
        let date = utils.convertDate(ctx.query.date),
            service = ctx.query.service,
            day = moment(date).weekday();

        return db.offers.find({
                service: mongoose.Types.ObjectId(service),
                days: day,
                $or: [
                    {dueDay: {$gte: date}},
                    {dueDay: {$exists: false}}
                ],
                startDay: {$lte: date},
                offDays: {$nin: [date]},
                type: 'pass'
            })
            .populate('type')
            .populate('addons')
            .populate('hotel')
            .exec()
            .then(offers => {
                let listOffer = [];
                offers.forEach(offer => {
                    // let currentTime = moment().tz(offer.hotel.address.timezone);
                    // let reserveDate = moment.tz(moment(date).format('YYYY-MM-DD'), offer.hotel.address.timezone);
                    // let offerTime = reserveDate.add(moment.duration(offer.duration.startTime/60, 'hours'));
                    // if (offerTime < currentTime) {
                    //     return;
                    // }

                    // New rule: disable offers that has less than 1 hour to endTime
                    let currentTime = moment().tz(offer.hotel.address.timezone);
                    let reserveDate = moment.tz(moment(date).format('YYYY-MM-DD'), offer.hotel.address.timezone);
                    let beginTime = reserveDate.clone().add(moment.duration(offer.duration.startTime/60, 'hours'));
                    let lastAllowTime = reserveDate.clone().add(moment.duration(offer.duration.endTime/60 - 1, 'hours'));
                    if ((beginTime < currentTime) && (lastAllowTime < currentTime)) {
                        return;
                    }

                    offer.date = date;
                    listOffer.push(offer);
                });
                ctx.body = {offers: listOffer.map(entities.offer)};
            });
    });

module.exports = router;
