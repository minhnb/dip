"use strict";

const db = require('../db');
const entities = require('../entities');

var adminServices = {};

adminServices.getListTestEmail = function (callback) {
    db.testEmails.find({}).exec().then((testEmails, error) => {
        let emails = testEmails.map(e => e.email);
        callback(new Set(emails), error);
    });
};

adminServices.getListSupportedLocations = function (callback) {
    db.dipLocations.find({"supported": true}).exec().then((dipLocations, error) => {
        let supportedLocations = dipLocations.map(location => location._id);
        callback(new Set(supportedLocations), error);
    });
};

adminServices.updateAppContext = function (ctx) {
    this.getListTestEmail((emails, error) => {
        if (!error) {
            ctx.testEmails = emails;
        }
    });
    this.getListSupportedLocations((supportedLocations, error) => {
        if (!error) {
            ctx.supportedLocations = supportedLocations;
        }
    });
};

module.exports = adminServices;