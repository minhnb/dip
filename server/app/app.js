"use strict";

const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const co = require('co');
const convert = require('koa-convert');
const json = require('koa-json');
//const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const error = require('koa-error');

const config = require('./config');
const router = require('./routes');

// middlewares
app.use(bodyparser);
app.use(convert(json()));
app.use(logger());
app.use(convert(require('koa-static')(__dirname + '/public')));

app.use(convert(views('views', {
    root: __dirname + '/views',
    default: 'jade'
})));

app.use((ctx, next) => {
    ctx.render = co.wrap(ctx.render);
    return next();
});

// Error handling
app.use((ctx, next) => {
    return next().catch(err => {
        ctx.response.status = err.status || 400;
        if (config.env != 'production' && config.env != 'prod') {
            console.log('caught', err);
            ctx.response.body = err.message || 'Bad Request';
        } else {
            // If err.expose is true, it means the error is safe to display to the user
            // err.expose is set to true whenever we use ctx.throw, so be careful!
            ctx.response.body = (err.expose ? err.message : null) || 'Bad Request';
        }
    });
});

// This is clean and nice, but we couldn't modify it to our needs
// Considering create a simple error-template for dev env and do it ourselves
//app.use(convert(error()));

app.on('error', function (err, ctx) {
    console.error('server error', err, ctx);
});

const auth = require('./passport_auth'); // Initialize auth strategies
app.use(auth.passport.initialize());

// response
app.use(router.routes(), router.allowedMethods());

module.exports = app;