"use strict";

const async = require('asyncawait/async');
const await = require('asyncawait/await');

const db = require('../db');
const entities = require('../entities');
const reservationServices = require('../services/reservation');

const DIPError = require('../helpers/DIPError');
const dipErrorDictionary = require('../constants/dipErrorDictionary');

var reportServices = {};

reportServices.dbGetListDIPUsers = function () {
    return db.users.find({"role": "user"})
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

reportServices.getListEventReservations = function () {
    let condition = {type: 'EventReservation'};
    return reservationServices.dbGetReservation(condition, true).then(reservations => {
        return reservations.map(entities.eventReservationReport);
    });
};

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
    if (user.role == 'admin') {
        return condition;
    } else if (user.role == 'partner') {
        if (reservationType == 'HotelReservation') {
            let hotelIds = await(db.hotels.find({owner: user}).select('_id').exec());
            hotelIds = hotelIds.map(h => h._id);
            condition['hotel.ref'] = {$in: hotelIds};
            return condition;
        } else {
            return null;
        }
    } else {
        return null;
    }
});

module.exports = reportServices;