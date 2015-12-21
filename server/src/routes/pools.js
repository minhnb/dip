"use strict";
const Router = require('koa-router');
const router = Router();
const pool = Router();

module.exports = router;

pool
    .get('pool', '/', ctx => {
        let id = ctx.params.id;
        ctx.body = {pool: {id: id}};
    })
    .get('pool photos', '/photos', ctx => {
        let id = ctx.params.id,
            filter = ctx.query;
        ctx.body = {photos: [], pool_id: id};
    })
    .get('pool availabilities', '/availabilities', ctx => {
        let id = ctx.params.id,
            date = ctx.query.date;
        ctx.body = {availabilities: [], pool_id: id, date: date};
    });

router
    .get('pools', '/', (ctx, next) => {
        // TODO: authenticate user
        // TODO: return list of pools
        let filter = ctx.query;
        ctx.body = {pools: []};
    })
    .use('/:id', pool.routes(), pool.allowedMethods());