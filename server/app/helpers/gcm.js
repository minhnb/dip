'use strict';

var gcm = require('node-gcm');

var db = require('../db');
var config = require('../config');

var sender = new gcm.Sender(config.gcm.apiKey);

function pushNotification(user, data) {
    var message = new gcm.Message({ data: data });

    //message.addNotification({
    //    title: 'Alert!!!',
    //    body: 'Abnormal data access',
    //    icon: 'ic_launcher'
    //});

    return db.devices.find({ user: user }).exec().then(function (devices) {
        devices = devices.map(function (d) {
            return d.pushToken;
        });
        return new Promise(function (resolve, reject) {
            sender.send(message, { registrationTokens: devices }, function (err, response) {
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