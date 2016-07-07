'use strict';

const request = require('request-promise');

const config = require('../config');

var eventList = {
    /**
     * @exports module.dipEventReservation
     */
    dipEventReservation: {
        event: config.iftttMaker.eventReservationEvent
    },
    /**
     * @exports maker.dipUserSignup
     */
    dipUserSignup: {
        event: config.iftttMaker.userSignupEvent
    }
};

/**
 * @module maker
 */
Object.keys(eventList).forEach(method => {
    exports[method] = function(data) {
        return triggerEvent(eventList[method].event, data);
    }
});

function triggerEvent(event, data) {
    return request.post({
        url: `https://maker.ifttt.com/trigger/${event}/with/key/${config.iftttMaker.secretKey}`,
        body: data,
        json: true,
        strictSSL: true
    });
}