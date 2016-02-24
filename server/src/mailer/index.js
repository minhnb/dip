'use strict';

const mailer = require('nodemailer');
//const sesTransport = require('nodemailer-ses-transport');

const config = require('../config/index');

const parser = require('./parser');

const transporter = mailer.createTransport({
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

    return new Promise((resolve, reject) => {
        transporter.sendMail({
            from: config.email.address,
            to: recipient,
            subject: subject,
            html: message
        }, (error, info) => {
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
    resetPassword: (email, data) => {
        return parser.resetPassword(data)
            .then(message => sendEmail(email, 'Reset Password', message));
    },
    welcome: (email, data) => {
        return parser.welcome(data)
            .then(message => sendEmail(email, 'Welcome to Dip', message));
    }
};