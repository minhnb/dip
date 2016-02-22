'use strict';

function convertDevice(device) {
    return {
        deviceId: device.deviceId,
        details: device.details
    };
}

module.exports = convertDevice;