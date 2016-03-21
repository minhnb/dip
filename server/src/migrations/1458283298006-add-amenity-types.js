'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const connection = require('../db/config');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    let now = new Date();
    let amenities = [
        {
            _id: 'sauna',
            name: 'Sauna',
            category: 'hotel'
        },
        {
            _id: 'spa',
            name: 'Spa',
            category: 'hotel'
        },
        {
            _id: 'daybed',
            name: 'Day Bed',
            category: 'hotel'
        },
        {
            _id: 'fitness',
            name: 'Fitness Center',
            category: 'hotel'
        },
        {
            _id: 'cabana',
            name: 'Cabana',
            category: 'pool'
        },
        {
            _id: 'chair',
            name: 'Chairs',
            category: 'pool'
        },
        {
            _id: 'jacuzzi',
            name: 'Jacuzzi',
            category: 'pool'
        },
        {
            _id: 'poolservice',
            name: 'Poolside Service',
            category: 'pool'
        },
        {
            _id: 'lifeguard',
            name: 'Life Guard',
            category: 'pool'
        },
        {
            _id: 'fireplace',
            name: 'Fire Place',
            category: 'pool'
        },
        {
            _id: 'alcohol',
            name: 'Alcohol',
            category: 'fare'
        }
    ];
    amenities.forEach(amenity => {
        amenity.createdAt = now;
        amenity.updatedAt = now;
    });
    let imgPromises = amenities.map(amenity => {
        let file_path = path.join(__dirname, `assets/amenity-${amenity._id}.png`);
        try {
            let data = fs.readFileSync(file_path);
            return s3.upload(`amenity/${amenity._id}`, data, 'image/png');
        } catch (err) {
            return Promise.reject(err);
        }
    });
    Promise.all(imgPromises).then(imgs => {
        for (let i = 0; i < amenities.length; i++) {
            amenities[i].icon = {
                url: imgs[i].Location,
                mediaType: 'image/png'
            };
        }

        return connection.db.collection('amenitytypes', (error, collection) => {
            collection.insert(amenities, next);
        });
    }).catch(next);
};

exports.down = function(next) {
    // Remove amenities?
    next();
};
