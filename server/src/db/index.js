"use strict";

const db = require('./config');

module.exports = {
    db: db,
    users: require('./users'),
    devices: require('./devices'),
    activities: require('./activities'),
    announcements: require('./announcements'),
    pools: require('./pools'),
    photos: require('./photos'),
    reservations: require('./reservations'),
    coupons: require('./coupons'),
    sessions: require('./sessions')
};