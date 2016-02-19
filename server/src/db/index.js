"use strict";

const db = require('./config');

module.exports = {
    db: db,
    users: require('./users'),
    devices: require('./devices'),
    activities: require('./activities'),
    announcements: require('./announcements'),
    pools: require('./pools'),
    offers: require('./offers'),
    baseOffers: require('./baseOffers'),
    tickets: require('./tickets'),
    amenities: require('./amenities'),
    amenityTypes: require('./amenityTypes'),
    photos: require('./photos'),
    reservations: require('./reservations'),
    coupons: require('./coupons'),
    sessions: require('./sessions')
};