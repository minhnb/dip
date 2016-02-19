'use strict';

function convertPoolReference(pool) {
    return {
        id: pool._id,
        name: pool.name,
        image_url: pool.image.url,
        reservable: pool.reservable,
        title: pool.title,
        coordinates: pool.coordinates ? {
            longitude: pool.coordinates[0],
            latitude: pool.coordinates[1]
        } : null
    };
}

module.exports = convertPoolReference;