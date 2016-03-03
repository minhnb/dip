"use strict";

const db = require('./config');

module.exports = {
    db: db,
    users: require('./users'),
    activities: require('./activities'),
    announcements: require('./announcements'),
    groups: require('./groups'),
    messages: require('./messages'),
    pools: require('./pools'),
    offers: require('./offers'),
    baseOffers: require('./baseOffers'),
    offerTypes: require('./offerTypes'),
    tickets: require('./tickets'),
    amenityTypes: require('./amenityTypes'),
    photos: require('./photos'),
    ratings: require('./ratings'),
    reservations: require('./reservations'),
    sales: require('./sales'),
    promotions: require('./promotions'),
    sessions: require('./sessions'),
    passwordToken: require('./passwordToken')
};