"use strict";

const Koa = require('koa');
const views = require('koa-views');
const convert = require('koa-convert');
const cors = require('kcors');

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
const db = require('./db');
const router = require('./routes');
const adminServices = require('./services/admin');
const DIPError = require('./helpers/DIPError');

app.use(bodyparser);
app.use(convert(json()));
require('koa-qs')(app, 'extended');
app.use(logger());

app.use(convert(require('koa-static')(`${serverFolder}/public`)));

app.use(convert(views('views', {
    root: `${serverFolder}/views`,
    default: 'jade'
})));

let corsOption = {
    origin: function (ctx) {
      return ctx.header.origin;
    },
    credentials: true
};
app.use(cors(corsOption));

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
        let isJsonResponse = false;
        if (ctx.headers.jsonerror == "true") {
            isJsonResponse = true;
        }
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
                // ctx.response.body = err.message || 'Internal Server Error';
                ctx.response.body = DIPError.responseError(err, false, isJsonResponse);
            }
        } else {
            // If err.expose is true, it means the error is safe to display to the user
            // err.expose is set to true whenever we use ctx.throw, so be careful!
            // ctx.response.body = (err.expose ? err.message : null) || 'Bad Request';
            ctx.response.body = DIPError.responseError(err, true, isJsonResponse);
        }
    });
});

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

const passport = require('./auth/passport'); // Initialize auth strategies
app.use(passport.initialize());

// response
app.use(router.routes(), router.allowedMethods());

// Fetch dip account before exporting
let adminEmail = config.admin.email;
db.users.findByEmail(adminEmail).exec().then(admin => {
    if (!admin) {
        console.error(`Couldn't find admin account ${adminEmail}`);
        process.exit(1);
    } else {
        app.context.dipId = admin._id;
    }
});

// Fetch test emails list & supported locations list from db
app.context.testEmails = new Set();
app.context.supportedLocations = new Set();
adminServices.updateAppContext(app.context);

module.exports = app;
