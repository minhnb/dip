'use strict';

const userRef = require('./userRef');
const reservation = require('./reservation');

function convertActivity(activity) {
    return {
        id: activity._id,
        type: activity.verb == 'Reservation' ? 'reserved' : '',
        associated_object_type: activity.verb,
        from: userRef(activity.actor),
        notified_at: activity.updatedAt,
        associated_object: activity.verb == 'Reservation' ? reservation(db.reservations.findById(activity.object)) : null
    };
}

module.exports = convertActivity;