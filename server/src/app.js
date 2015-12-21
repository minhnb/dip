"use strict";
const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const co = require('co');
const convert = require('koa-convert');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');

const router = require('./routes/root');

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(convert(require('koa-static')(__dirname + '/public')));

app.use(convert(views('views', {
    root: __dirname + '/views',
    default: 'jade'
})));

app.use((ctx, next) => {
    ctx.render = co.wrap(ctx.render);
    return next();
});

// logger
app.use((ctx, next) => {
    const start = new Date;
    next().then(() => {
        const ms = new Date - start;
        console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
    });
});
app.on('error', function (err, ctx) {
    log.error('server error', err, ctx);
});

// response
app.use(router.routes(), router.allowedMethods());

module.exports = app;