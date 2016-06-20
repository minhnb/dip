'use strict';

function convertDipLocations(dipLocation) {
    if (!dipLocation) {
        return null;
    }
    return {
        id: dipLocation._id,
        name: dipLocation.name,
        description: dipLocation.description
    };
}

module.exports = convertDipLocations;