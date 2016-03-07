"use strict";

const Koa = require('koa');
const views = require('koa-views');
const convert = require('koa-convert');

const logger = require('koa-logger');
const dotenv = require('dotenv');

const Hipchatter = require('hipchatter');

const co = require('co');
const json = require('koa-json');
//const onerror = require('koa-onerror');
const error = require('koa-error');

const bodyparser = require('koa-bodyparser')();
const path = require('path');

var hipchatter = new Hipchatter('4561f3fb57f873056b4eea66e7bf27');

var rootFolder = path.normalize(__dirname + '/../..'),
    serverFolder = `${rootFolder}/server`;

dotenv.load({
    path: `${rootFolder}/.env`
});

const app = new Koa();

const config = require('./config');
const router = require('./routes');

app.use(bodyparser);
app.use(convert(json()));
require('koa-qs')(app, 'extended');
app.use(logger());

app.use(convert(require('koa-static')(`${serverFolder}/public`)));

app.use(convert(views('views', {
    root: `${serverFolder}/views`,
    default: 'jade'
})));

app.use((ctx, next) => {
    ctx.render = co.wrap(ctx.render);
    return next();
});

// Error handling
app.use((ctx, next) => {
    return next().catch(err => {
        ctx.response.status = err.status || 500;
        hipchatter.notify('Dip-DevOps',{
            message: err.message,
            color: 'yellow',
            token: 'By0ccj1t2AEjdbhgCD7O3FjMhWllcJWb4xkaIBCs'
        }, function(err){
            if (err == null) console.log('Successfully notified the room.');
        });
        if (config.env != 'production' && config.env != 'prod') {
            console.log('caught', err);

            // Print stack trace if debug is set to 1 (only for dev/sandbox/testing... env)
            if (ctx.query.debug) {
                let title = 'Error Debug',
                    message = err.message || 'Internal Server Error';
                ctx.render('error', {
                    title: title,
                    message: message,
                    error: err
                });
            } else {
                ctx.response.body = err.message || 'Internal Server Error';
            }
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
process.on('uncaughtException', function(err) {
    hipchatter.notify('Dip-DevOps',{
        message: `Error: ${err} - Enviroment: ${process.env.NODE_ENV}`,
        color: 'red',
        token: '3GitaVbKmdLiOle45NIzalVVEMJpPgOst1yEr8jH'
    }, function(err){
        if (err == null) console.log("error", err, 'Successfully notified the team.');
    });
});

app.on('error', function (err, ctx) {
    console.error('server error', err, ctx);
});

const auth = require('./helpers/passport_auth'); // Initialize auth strategies
app.use(auth.passport.initialize());

// response
app.use(router.routes(), router.allowedMethods());

module.exports = app;
