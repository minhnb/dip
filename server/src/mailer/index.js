'use strict';

const fs = require('fs');
const path = require('path');
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
}

const emailTemplateRoot = path.join(__dirname, 'templates');

function getTemplate(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(emailTemplateRoot, name), 'utf-8', (err, source) => {
            if (err) {
                console.error(__filename, 'getTemplate.readFile error', err);
                reject(err);
            } else {
                resolve(source);
            }
        });
    });
}

module.exports = {
    resetPassword: (email, data) => {
        return getTemplate('resetPassword.html')
            .then(parser.bind(undefined, data))
            .then(sendEmail.bind(undefined, email, 'Reset Password'))
    },
    welcome: (email, data) => {
        return getTemplate('welcome.html')
            .then(parser.bind(undefined, data))
            .then(sendEmail.bind(undefined, email, 'Welcome to Dip'))
    },
    addFriend: (email, data) => {
        return getTemplate('addFriend.html')
            .then(parser.bind(undefined, data))
            .then(sendEmail.bind(undefined, email, `${data.actor.nameOrEmail} added you as a friend on Dip`))
    },
    confirmReservation: (email, data) => {
        return getTemplate('confirmReservation.html')
            .then(parser.bind(undefined, data))
            .then(sendEmail.bind(undefined, email, 'Reservation Confirmation'))
    }
};