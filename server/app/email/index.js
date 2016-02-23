'use strict';

var mailer = require('nodemailer');
//const sesTransport = require('nodemailer-ses-transport');

var config = require('../config/index');

var parser = require('./parser');

var transporter = mailer.createTransport({
    host: config.email.server,
    secure: true,
    auth: {
        user: config.email.user,
        pass: config.email.password
    },
    pool: true,
    maxMessages: 10,
    rateLimit: 5
});

//const client = require('node-ses');
//
//const client = ses.createClient({
//    key: config.aws.key,
//    secret: config.aws.secret,
//    amazon: config.email.server
//});

function sendEmail(recipient, subject, message) {

    return new Promise(function (resolve, reject) {
        transporter.sendMail({
            from: config.email.address,
            to: recipient,
            subject: subject,
            html: message
        }, function (error, info) {
            if (error) {
                console.error(__filename, 'Email sending error', error);
                reject(error);
            } else {
                resolve(info);
            }
        });
    });

    //return new Promise((resolve, reject) => {
    //    client.sendEmail({
    //        from: config.email.address,
    //        to: recipient,
    //        subject: subject,
    //        message: message
    //    }, (err, data, res) => {
    //        if (err) {
    //            console.error(__filename, 'sendEmail error', err);
    //            console.log('email data obj', data);
    //            console.log('email res obj', res);
    //            reject(err);
    //        } else {
    //            console.log('email sent');
    //            resolve(data);
    //        }
    //    });
    //});
}

module.exports = {
    resetPassword: function resetPassword(email, data) {
        return parser.resetPassword(data).then(function (message) {
            return sendEmail(email, 'Reset Password', message);
        });
    },
    welcome: function welcome(email, data) {
        return parser.welcome(data).then(function (message) {
            return sendEmail(email, 'Welcome to Dip', message);
        });
    }
};