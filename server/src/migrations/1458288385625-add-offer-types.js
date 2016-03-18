'use strict';

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootFolder = path.normalize(__dirname + '/../../..');

dotenv.load({
    path: `${rootFolder}/.env`
});

const db = require('../db');
const s3 = require('../helpers/s3');

exports.up = function(next) {
    let offers = [
        {
            _id: 'pass',
            name: 'Pool Pass'
        },
        {
            _id: 'chair',
            name: 'Chairs'
        },
        {
            _id: 'cabana',
            name: 'Cabana'
        }
    ];

    let imgPromises = offers.map(offer => {
        let file_path = path.join(__dirname, `assets/offer-${offer._id}.png`);
        try {
            let data = fs.readFileSync(file_path);
            return s3.upload(`offer/${offer._id}`, data, 'image/png');
        } catch (err) {
            return Promise.reject(err);
        }
    });
    return Promise.all(imgPromises).then(imgs => {
        for (let i = 0; i < offers.length; i++) {
            offers[i].icon = {
                url: imgs[i].Location,
                mediaType: 'image/png'
            };
        }
        return db.offerTypes.collection.insert(offers, (error, docs) => {
            next(error);
        });
    }).catch(next);
};

exports.down = function(next) {
  next();
};
