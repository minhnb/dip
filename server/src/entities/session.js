'use strict';

const deviceEntity = require('./device');

function convertSession(session) {
    return {
        id: session._id,
        createdAt: session.createdAt,
        device: session.device ? deviceEntity(session.device) : null
    };
}

module.exports = convertSession;