'use strict';

function convertAmenity(amenity) {
    return {
        name: amenity.type.name,
        category: amenity.type.category,
        icon: amenity.type.icon,
        details: amenity.details,
        count: amenity.count
    }
}

module.exports = convertAmenity;