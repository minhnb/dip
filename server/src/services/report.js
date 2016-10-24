"use strict";

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const db = require('../db');
const entities = require('../entities');
const reservationServices = require('../services/reservation');

const DIPError = require('../helpers/DIPError');
const dipErrorDictionary = require('../constants/dipErrorDictionary');
const userRole = require('../constants/userRole');

var reportServices = {};

reportServices.dbGetListDIPUsers = function () {
    return db.users.find({role: userRole.USER})
        .populate({
            path: 'account.subscriptions.type',
            model: db.membershipTypes
        }).exec().then(listUser => {
        return listUser;
    });
};

reportServices.getListDIPUsers = function () {
    return this.dbGetListDIPUsers().then(listUser => {
        return listUser.map(entities.userReport);
    })
};

reportServices.getListEventReservations = async (function (user) {
    // let condition = {type: 'EventReservation'};
    let condition = await (_buildCondition(user, 'EventReservation'));
    if (!condition) throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
    return reservationServices.dbGetReservation(condition, true).then(reservations => {
        return reservations.map(entities.eventReservationReport);
    });
});

reportServices.getListHotelReservations = async (function (user) {
    // let condition = {type: 'HotelReservation'};
    let condition = await (_buildCondition(user, 'HotelReservation'));
    if (!condition) throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
    return reservationServices.dbGetReservation(condition, true).then(reservations => {
        return reservations.map(entities.hotelReservationReport);
    });
});

// reportServices.getListReservations = async ((ctx, next) => {
//     let user = ctx.state.user;
//     let condition = _buildCondition(user, 'HotelReservation');
//     if (condition) {
//         let reservations = await (reservationServices.dbGetReservation(condition, true));
//         ctx.body = reservations.map(entities.hotelReservationReport);
//         return next();
//     } else {
//         throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
//     }
// });

/**
 *
 * @type {function(user, reservationType: String): Promise<Object>}
 * @private
 *
 * @return Object | null
 */
var _buildCondition = reportServices.buildCondition = async ((user, reservationType) => {
    let condition = {type: reservationType};
    if (user.isAdmin()) {
        return condition;
    } else if (user.isPartner()) {
        if (reservationType == 'HotelReservation') {
            let hotelIds = await(db.hotels.find({owner: user}).select('_id').exec());
            hotelIds = hotelIds.map(h => h._id);
            condition['hotel.ref'] = {$in: hotelIds};
            return condition;
        } else if (reservationType == 'EventReservation') {
            let hotelIds = await(db.hotels.find({owner: user}).select('_id').exec());
            hotelIds = hotelIds.map(h => h._id);
            let eventIds = await(db.events.find({hotel: {$in: hotelIds}}).select('_id').exec());
            eventIds = eventIds.map(e => e._id);
            condition['event.ref'] = {$in: eventIds};
            return condition;
        } else {
            return null;
        }
    } else {
        return null;
    }
});

module.exports = reportServices;