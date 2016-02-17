'use strict';

var userRef = require('./userRef');
var reservation = require('./reservation');

function convertActivity(activity) {
    return {
        id: activity._id,
        type: activity.verb == 'Reservation' ? 'reserved' : '',
        associatedObjectType: activity.verb,
        from: userRef(activity.actor),
        notifiedAt: activity.updatedAt,
        associatedObject: activity.verb == 'Reservation' ? reservation(db.reservations.findById(activity.object)) : null
    };
}

module.exports = convertActivity;