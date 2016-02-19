'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');

const validator = require('../../../validators');
const utils = require('../../../helpers/utils');

router.get('pool', '/', ctx => {
        ctx.body = {pool: entities.pool(ctx.state.pool)};
    })
    .get('pool photos', '/photos',
        validator.poolPhotos(),
        ctx => {
            let pool = ctx.state.pool,
                limit = ctx.query.limit || 100,
                offset = ctx.query.offset || 0;
            return db.photos.find({pool: pool})
                .populate('user')
                .limit(limit)
                .skip(offset)
                .exec()
                .then(photos => {
                    ctx.body = {photos: photos.map(entities.photo)};
                });
        })
    .get('pool offers', '/offers',
        validator.offers(true),
        ctx => {
            let date = ctx.query.date,
                pool = ctx.state.pool;
            return db.offers.find({
                    pool: pool,
                    date: utils.convertDate(date)
                })
                .populate({
                    path: 'amenities',
                    model: 'Amenity',
                    populate: {
                        path: 'type',
                        model: 'AmenityType'
                    }
                })
                .populate('ticket.ref')
                .exec()
                .then(offers => {
                    ctx.body = {offers: offers.map(entities.offer)};
                });
            //return db.pool.find({_id: ctx.params.id, "offers.date": utils.convertDate(date)}).exec().then(function(pool_data) {
            //    ctx.response.body = {
            //        offers: pool_data.offers.map(x => {
            //            return entities.offer(x, pool_data);
            //        })
            //    };
            //});
        });

module.exports = router;