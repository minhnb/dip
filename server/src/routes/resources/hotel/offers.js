'use strict';

const router = require('koa-router')();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const db = require('../../../db');
const entities = require('../../../entities');
const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

const DIPError = require('../../../helpers/DIPError');
const dipErrorDictionary = require('../../../constants/dipErrorDictionary');

/**
 * @api Get hotel's offers for a service for a date
 *
 * When no date is passed in,
 * use current date as start point and keep incrementing it (till at most 2 weeks later)
 * until offers list is not empty
 ---------------------------------------------------------------------------------------*/
router.get('/',
    validator.offers(true),
    ctx => {
        // TODO: Add filter for price and duration
        let serviceId = ctx.query.service,
            hotel = ctx.state.hotel,
            service = hotel.services.id(serviceId),
            date = utils.convertDate(ctx.query.date);

        if (!service) throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);

        let currentTime = moment().tz(hotel.address.timezone);
        if (date) {
            let reserveDate = moment.tz(date, hotel.address.timezone);
            let day = reserveDate.weekday();

            return db.offers.find({
                hotel: hotel,
                service: mongoose.Types.ObjectId(serviceId),
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
                    // New rule: disable offers that has less than 1 hour to endTime
                    let beginTime = reserveDate.clone().add(moment.duration(offer.duration.startTime / 60, 'hours'));
                    let lastAllowTime = reserveDate.clone().add(moment.duration(offer.duration.endTime / 60 - 1, 'hours'));
                    if ((beginTime < currentTime) && (lastAllowTime < currentTime)) {
                        return;
                    }

                    offer.date = date;
                    listOffer.push(offer);
                });
                ctx.body = {offers: listOffer.map(entities.offer), date: date};
            });
        } else {
            let date = utils.formatMomentDate(currentTime),
                today = moment.tz(date, hotel.address.timezone); // so that we can get rid of hh:mm:ss in currentTime
            return db.offers.find({
                hotel: hotel,
                service: mongoose.Types.ObjectId(serviceId),
                $or: [
                    {dueDay: {$gte: date}},
                    {dueDay: {$exists: false}}
                ],
                type: 'pass'
            })
            .populate('type')
            .populate('addons')
            .populate('hotel')
            .exec()
            .then(offers => {
                let listOffer = [];
                let reserveDate = today.clone(),
                    date, weekday;
                for(let i = 0; i < 14; i++) {
                    reserveDate = reserveDate.add(1, 'days');
                    date = utils.formatMomentDate(reserveDate);
                    weekday = reserveDate.weekday();
                    offers.forEach(offer => {
                        if (offer.days.indexOf(weekday) == -1
                        || offer.startDay > date
                        || (offer.dueDay && offer.dueDay < date)
                        || offer.offDays.indexOf(date) > -1
                        || (offer.reservationCount && offer.reservationCount[date] && offer.reservationCount[date] >= offer.allotmentCount))
                            return;

                        let beginTime = reserveDate.clone().add(moment.duration(offer.duration.startTime / 60, 'hours'));
                        let lastAllowTime = reserveDate.clone().add(moment.duration(offer.duration.endTime / 60 - 1, 'hours'));
                        if ((beginTime < currentTime) && (lastAllowTime < currentTime)) {
                            return;
                        }

                        offer.date = date;
                        listOffer.push(offer);
                    });
                    if (listOffer.length > 0) break;
                }
                ctx.body = {offers: listOffer.map(entities.offer), date: date};
            });
        }
    });

module.exports = router;
