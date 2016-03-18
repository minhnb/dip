'use strict';

const dotenv = require('dotenv');
const path = require('path');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const db = require('../db');
const s3 = require('../helpers/s3');
const fs = require('fs');

exports.up = function(next) {
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
    let imgPromises = amenities.map(amenity => {
        let file_path = `assets/amenity-${amenity._id}.png`;
        try {
            let data = fs.readFileSync(file_path);
            return s3.upload(`amenity/${amenity._id}`, data, 'image/png');
        } catch (err) {
            return Promise.reject(err);
        }
    });
    Promise.all(imgPromises).then(imgs => {
        for (let i = 0; i++; i < amenities.length) {
            amenities[i].icon = {
                url: imgs[i].Location,
                mediaType: 'image/png'
            }
        }
        return db.amenityTypes.collection.insert(amenities, (error, docs) => {
            next(error);
        });
    }).catch(next);
};

exports.down = function(next) {
    // Remove amenities?
    next();
};
