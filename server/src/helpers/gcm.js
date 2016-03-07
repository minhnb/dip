'use strict';

const gcm = require('node-gcm');

const db = require('../db');
const config = require('../config');

const sender = new gcm.Sender(config.gcm.apiKey);

function pushNotification(user, data) {
    if (!data.priority) {
        data.priority = 'high';
    }
    if (data.data) {
        data.contentAvailable = true;
    }
    var message = new gcm.Message(data);

    //message.addNotification({
    //    title: 'Alert!!!',
    //    body: 'Abnormal data access',
    //    icon: 'ic_launcher'
    //});

    return db.sessions
        .find({user: user})
        .exec()
        .then(sessions => {
            let devices = sessions.reduce((arr, session) => {
                if (session.device) {
                    arr.push(session.device);
                }
                return arr;
            }, []);
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