"use strict";

const db = require('../db');
const entities = require('../entities');

var geocoderProvider = 'google';
var httpAdapter = 'http';
const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

const dipConstant = require('../constants/constants');
const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

var resourcesServices = {};

resourcesServices.isSupportLocationByCoordinates = function (longitude, latitude) {
    return geocoder.reverse({lat: latitude, lon: longitude})
        .then(function (res) {
            let city = res[0].administrativeLevels.level2long,
                state = res[0].administrativeLevels.level1long;
            return db.cities
                .findOne({'$and': [{city: city}, {state: state}]})
                .exec();
        })
        .then(city => {
            if (!city) {
                // ctx.throw(404, 'Not Support');
                throw new DIPError(dipErrorDictionary.NOT_SUPPORT);
            }
        })
};

resourcesServices.dbSearchNearestHotels =  function(searchKey, condition, longitude, latitude, maxDistance, minDistance, sort, limit, skip) {
    let virtualFieldKey = "nameAndNeighborhood";
    let aggregate = [], project = {}, searchKeyCondition = {};
    let needDistanceKey = false;
    if (longitude && latitude) {
        let coordinates = [];
        coordinates.push(parseFloat(longitude));
        coordinates.push(parseFloat(latitude));
        let geoNear = {
            near: {type: "Point", coordinates: coordinates},
            distanceField: "distance",
            distanceMultiplier: dipConstant.METER_TO_MILE,
            query: condition,
            spherical: true
        };
        if (maxDistance) {
            geoNear.maxDistance = maxDistance;
        }
        if (minDistance) {
            geoNear.minDistance = minDistance;
        }
        aggregate.push({$geoNear: geoNear});
        needDistanceKey = true;
    }

    if (searchKey) {
        for (var key in db.hotels.schema.paths) {
            project[key] = 1;
        }
        project[virtualFieldKey] = {$concat:["$name", " ", "$address.neighborhood"]};
        aggregate.push({$project: project});
        let words = searchKey.trim().split(" ");
        let andConditions = [];
        words.forEach(word => {
            let item = {};
            item[virtualFieldKey] = new RegExp(".*" + word + ".*", "i");
            andConditions.push(item);
        });

        searchKeyCondition = {$and: andConditions};
    }

    aggregate.push({$match: searchKeyCondition});

    let query = db.hotels.aggregate(aggregate);
    let aggregateSort = resourcesServices.createAggregateSort(sort, needDistanceKey);
    if (aggregateSort && aggregateSort.length > 0) {
        query = query.sort(aggregateSort);
    }

    if (skip) {
        query = query.skip(skip);
    }

    if (limit) {
        query = query.limit(limit);
    }

    return query.exec().then((hotels) => {
        return hotels;
    });
};

resourcesServices.createAggregateSort = function (sort, needDistanceKey) {
    let result = [];
    if (sort != undefined) {
        let hasDistanceKey = false;
        for (var key in sort) {
            if (key == 'distance') {
                hasDistanceKey = true;
            }
            let sortKeyToString = '';
            if (sort[key] < 0) {
                sortKeyToString = '-' + key;
            } else if (sort[key] > 0) {
                sortKeyToString = key;
            }
            result.push(sortKeyToString);
        }
        if (!hasDistanceKey && needDistanceKey) {
            result.push('distance');
        }
    } else {
        if (needDistanceKey) {
            result = ['distance'];
        }
    }

    return result.join(' ');
};

module.exports = resourcesServices;