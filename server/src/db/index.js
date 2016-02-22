"use strict";

const db = require('./config');

module.exports = {
    db: db,
    users: require('./users'),
    devices: require('./devices'),
    activities: require('./activities'),
    announcements: require('./announcements'),
    groups: require('./groups'),
    messages: require('./messages'),
    pools: require('./pools'),
    offers: require('./offers'),
    baseOffers: require('./baseOffers'),
    tickets: require('./tickets'),
    amenities: require('./amenities'),
    amenityTypes: require('./amenityTypes'),
    photos: require('./photos'),
    ratings: require('./ratings'),
    reservations: require('./reservations'),
    coupons: require('./coupons'),
    sessions: require('./sessions')
};