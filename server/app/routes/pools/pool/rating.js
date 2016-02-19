'use strict';

var router = require('koa-router')();

var db = require('../../../db');
var validator = require('../../../validators');

router.put('/', validator.rating(), function (ctx) {
    var rating = parseFloat(ctx.request.body.rating),
        user = ctx.state.user,
        pool = ctx.state.pool;

    return db.ratings.findOne({
        user: user,
        pool: pool
    }).then(function (userRating) {
        if (userRating) {
            userRating.rating = rating;
        } else {
            userRating = new db.ratings({
                user: user,
                pool: pool,
                rating: rating
            });
        }
        return userRating.save();
    }).then(function () {
        return db.ratings.aggregate([{ $match: {
                pool: pool._id
            } }, { $group: {
                _id: '$pool',
                avg: { $avg: '$rating' },
                count: { $sum: 1 }
            } }]).exec();
    }).then(function (ratings) {
        var rating = { count: 0 };
        if (ratings.length > 0) {
            rating = ratings[0];
        }
        pool.rating.avg = rating.avg;
        pool.rating.count = rating.count;
        return pool.save();
    }).then(function () {
        ctx.status = 204;
    });
});

module.exports = router;