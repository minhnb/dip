'use strict';

function convertBase(base) {
    return {
        name: base.name,
        category: base.category,
        icon: base.icon
    }
}

function convertAmenity(amenity) {
    let base = convertBase(amenity.type);
    base.details = amenity.details;
    return base;
}
convertAmenity.base = convertBase;

module.exports = convertAmenity;