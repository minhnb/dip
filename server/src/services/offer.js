"use strict";

const db = require('../db');
const entities = require('../entities');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

const dipConstant = require('../constants/constants');
const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const utils = require('../helpers/utils');

var offerServices = {};

/**
 * @api Get hotel's offers for a service for a date
 *
 * When no date is passed in,
 * use current date as start point and keep incrementing it (till at most 2 weeks later)
 * until offers list is not empty
 ---------------------------------------------------------------------------------------*/
offerServices.getOffers = function (hotel, serviceId, queryDate) {
    // TODO: Add filter for price and duration
    if (!moment(queryDate).isValid()) {
        throw new DIPError(dipErrorDictionary.INVALID_DATE);
    }
    let date = utils.convertDate(queryDate);

    if (hotel.services.indexOf(serviceId) == -1) throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);

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
                    if (!offerServices.isValidOfferWithCurrentTime(offer, reserveDate, currentTime)) {
                        return;
                    }

                    offer.date = date;
                    listOffer.push(offer);
                });
                return {offers: listOffer.map(entities.offer), date: date};
            });
    } else {
        let todayFormatted = utils.formatMomentDate(currentTime),
            today = moment.tz(todayFormatted, hotel.address.timezone); // so that we can get rid of hh:mm:ss in currentTime
        return db.offers.find({
            hotel: hotel,
            service: mongoose.Types.ObjectId(serviceId),
            $or: [
                {dueDay: {$gte: todayFormatted}},
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
                let reserveDate, reserveDateFormatted, weekday;
                for(let i = 0; i < 14; i++) {
                    reserveDate = today.clone().add(i, 'days');
                    reserveDateFormatted = utils.formatMomentDate(reserveDate);
                    weekday = reserveDate.weekday();
                    offers.forEach(offer => {
                        if (!offerServices.isValidOffer(offer, weekday, reserveDateFormatted)) {
                            return;
                        }
                        if (!offerServices.isValidOfferWithCurrentTime(offer, reserveDate, currentTime)) {
                            return;
                        }

                        offer.date = reserveDateFormatted;
                        listOffer.push(offer);
                    });
                    if (listOffer.length > 0) break;
                }
                if (listOffer.length == 0) {
                    // Change back to today if no offers found
                    reserveDateFormatted = utils.formatMomentDate(today);
                }
                return {offers: listOffer.map(entities.offer), date: reserveDateFormatted};
            });
    }
};

offerServices.getAvailableDays = function (hotel, serviceId, queryDate) {
    // TODO: Add filter for price and duration
    let momentDate = moment.tz(queryDate, hotel.address.timezone);
    if (!momentDate.isValid()) {
        throw new DIPError(dipErrorDictionary.INVALID_DATE);
    }
    if (hotel.services.indexOf(serviceId) == -1) throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);

    let currentTime = moment().tz(hotel.address.timezone);
    let todayFormatted = utils.formatMomentDate(currentTime);

    let startDate = momentDate.clone().startOf('month');
    var endDate = momentDate.clone().endOf('month');
    if (endDate < currentTime) {
        return [];
    }
    if (startDate < currentTime) {
        startDate = currentTime;
    }

    let start = startDate.date();
    let end = endDate.date();
    let maxAvailableDays = end - start + 1;

    return db.offers.find({
            hotel: hotel,
            service: mongoose.Types.ObjectId(serviceId),
            $or: [
                {dueDay: {$gte: todayFormatted}},
                {dueDay: {$exists: false}}
            ],
            type: 'pass'
        })
        .exec()
        .then(offers => {
            let listAvailableDays = [];
            let reserveDate, reserveDateFormatted, weekday;
            for (let i = 0; i < maxAvailableDays; i++) {
                reserveDate = startDate.clone().add(i, 'days');
                reserveDateFormatted = utils.formatMomentDate(reserveDate);
                weekday = reserveDate.weekday();
                for (var j = 0; j < offers.length; j++) {
                    let offer = offers[j];
                    if (offerServices.isValidOffer(offer, weekday, reserveDateFormatted)
                        && offerServices.isValidOfferWithCurrentTime(offer, reserveDate, currentTime)) {
                        listAvailableDays.push(reserveDate.date());
                        break;
                    }
                }
            }
            return listAvailableDays;
        });
};

offerServices.isValidOffer = function (offer, weekday, reserveDateFormatted) {
    if (offer.days.indexOf(weekday) == -1
        || offer.startDay > reserveDateFormatted
        || (offer.dueDay && offer.dueDay < reserveDateFormatted)
        || offer.offDays.indexOf(reserveDateFormatted) > -1
        || (offer.reservationCount && offer.reservationCount[reserveDateFormatted] && offer.reservationCount[reserveDateFormatted] >= offer.allotmentCount))
        return false;
    return true;
};

offerServices.isValidOfferWithCurrentTime = function (offer, reserveDate, currentTime) {
    let beginTime = reserveDate.clone().add(moment.duration(offer.duration.startTime / 60, 'hours'));
    let lastAllowTime = reserveDate.clone().add(moment.duration(offer.duration.endTime / 60 - 1, 'hours'));
    if ((beginTime < currentTime) && (lastAllowTime < currentTime)) {
        return false;
    }
    return true;
};

module.exports = offerServices;