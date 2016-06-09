'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelServices = require('../../hotel_services');

const poolServiceSchema = new Schema({
    poolType: String
}, {
    timestamps: true,
    discriminatorKey: 'type'
});

var PoolServices = hotelServices.discriminator('PoolService',
  poolServiceSchema);

module.exports = PoolServices;