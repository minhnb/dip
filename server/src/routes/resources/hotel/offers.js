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

const offerServices = require('../../../services/offer');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

router.get('/',
    async(ctx => {
        let serviceId = ctx.query.service,
            hotel = ctx.state.hotel,
            date = ctx.query.date;
        ctx.body = await(offerServices.getOffers(hotel, serviceId, date));
    })
);

module.exports = router;
