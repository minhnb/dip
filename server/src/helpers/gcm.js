'use strict';

const gcm = require('node-gcm');

const db = require('../db');
const config = require('../config');

const sender = new gcm.Sender(config.gcm.apiKey);

function pushNotification(user, data) {
    var message = new gcm.Message({
        data: data,
        notification: {
            title: data.user.fullName,
            body: data.content,
            sound: 'default',
            badge: 1
        }
    });

    //message.addNotification({
    //    title: 'Alert!!!',
    //    body: 'Abnormal data access',
    //    icon: 'ic_launcher'
    //});

    return db.devices.find({user: user})
        .exec()
        .then(devices => {
            if (devices.length == 0) {
                return {success: 1};
            }
            devices = devices.map(d => d.deviceToken);
            return new Promise((resolve, reject) => {
                sender.send(message, {registrationTokens: devices}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
        });
}

module.exports = {
    sender: sender,
    pushNotification: pushNotification
};