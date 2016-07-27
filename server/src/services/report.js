"use strict";

const db = require('../db');
const entities = require('../entities');
const reservationServices = require('../services/reservation');

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

reportServices.getListHotelReservations = function () {
    let condition = {type: 'HotelReservation'};
    return reservationServices.dbGetReservation(condition, true).then(reservations => {
        return reservations.map(entities.hotelReservationReport);
    });
};

module.exports = reportServices;