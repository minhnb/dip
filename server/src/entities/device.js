'use strict';

function convertDevice(device) {
    return {
        deviceId: device.deviceId,
        deviceToken: device.deviceToken,
        details: device.details
    };
}

module.exports = convertDevice;