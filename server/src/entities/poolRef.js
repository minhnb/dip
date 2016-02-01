'use strict';

function convertPoolReference(pool) {
    return {
        id: pool._id,
        name: pool.name,
        image_url: pool.image.url,
        reservable: pool.reservable,
        title: pool.title,
        coordinate: pool.coordinate ? {
                longitude: pool.coordinate[0],
                latitude: pool.coordinate[1]
            } : null
    };
}

module.exports = convertPoolReference;