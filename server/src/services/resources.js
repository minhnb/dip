"use strict";

const db = require('../db');
const entities = require('../entities');

var geocoderProvider = 'google';
var httpAdapter = 'http';
const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

const dipConstant = require('../constants/constants');
const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const s3 = require('../helpers/s3');
const crypto = require('crypto');

const async = require('asyncawait/async');
const await = require('asyncawait/await');

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
    let aggregate = [], project = {}, aggregateCondition = {};
    let needDistanceKey = false;

    if (condition == undefined) {
        condition = {};
    }
    condition.deleted = false;
    aggregateCondition = condition;

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
        aggregateCondition = {};
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

        if (aggregateCondition.$and == undefined) {
            aggregateCondition.$and = [];
        }
        aggregateCondition.$and.push({$and: andConditions});
    }
    aggregate.push({$match: aggregateCondition});

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
    result.push('_id');

    return result.join(' ');
};

resourcesServices.createHotel = function (hotel) {
    return resourcesServices.dbCreateHotel(hotel).then(hotel => {
       return entities.hotel(hotel);
    });
};

resourcesServices.updateHotelImage = function (hotelId, img) {
    return resourcesServices.dbUpdateHotelImage(hotelId, img).then(hotel => {
        return entities.hotel(hotel);
    });
};

resourcesServices.getListPendingHotel = function () {
    return resourcesServices.dbGetListPendingHotel().then(hotels => {
        return hotels.map(entities.hotel);
    });
};

resourcesServices.dbCreateHotel = function (hotel) {
    if (!hotel.fullAddress) {
        throw new DIPError(dipErrorDictionary.HOTEL_INVALID_ADDRESS);
    }
    hotel.featured = false;
    hotel.reservable = false;
    hotel.active = false;
    if (hotel._id) {
        delete hotel._id;
    }
    if (hotel.dipLocation) {
        delete hotel.dipLocation;
    }
    if (hotel.image) {
        delete hotel.image;
    }

    let hotelAddressData = await(resourcesServices.getHotelAddress(hotel.fullAddress));
    hotel.address = hotelAddressData.address;
    hotel.coordinates = hotelAddressData.coordinates;

    hotel.address.city = hotel.city;
    hotel.address.neighborhood = hotel.neighborhood;
    delete hotel.city;
    delete hotel.neighborhood;

    let newHotel = db.hotels(hotel);
    return newHotel.save();
};

resourcesServices.dbUpdateHotelImage = function (hotelId, img) {
    if (!img) {
        throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
    }
    let hotel = await(db.hotels.findById(hotelId));
    let uploadImage = await(resourcesServices.uploadHotelImage(img, hotel.name, null));
    if (uploadImage) {
        hotel.image = {
            url: uploadImage.Location,
            verified: true
        };
        return hotel.save();
    } else {
        throw new DIPError(dipErrorDictionary.S3_ERROR);
    }
};

resourcesServices.dbGetListPendingHotel = function () {
    let condition = {};
    condition.active = false;
    let sort = {_id: -1};
    return db.hotels.find(condition).sort(sort).exec().then(hotels => {
        return hotels;
    });
};

resourcesServices.getHotelAddress = function (hotelFullAddress) {
    return geocoder.geocode(hotelFullAddress)
        .then(data => {
            if (data.length == 0) {
                throw new DIPError(dipErrorDictionary.HOTEL_ADDRESS_NOT_FOUND);
            }
            let hotelAddressData = {
                address: {},
                coordinates: []
            };
            hotelAddressData.address.street = hotelFullAddress.split(",")[0];
            if (data.length > 0) {
                hotelAddressData.address.state = data[0].administrativeLevels.level1short;
                hotelAddressData.coordinates.push(data[0].longitude);
                hotelAddressData.coordinates.push(data[0].latitude);
            }

            let tmpAddArr = hotelFullAddress.split(" ");
            hotelAddressData.address.postalCode = tmpAddArr[tmpAddArr.length - 1];

            return hotelAddressData;
        });
};

resourcesServices.uploadHotelImage = function (img, hotelName, serviceType) {
    let key = 'hotels';
    if (serviceType) {
        key = 'pools';
    }
    let hash = crypto.createHash('md5').update(img.buffer).digest("hex");
    let path = key + '/' + hotelName.replace(/ /g, "_").toLowerCase() + '_' + hash;
    let uploadImage = await(s3.uploadResizedImage(img, undefined, path));
    let uploadResizedImage = await(s3.uploadResizedImage(img, dipConstant.HOTEL_IMAGE_WIDTH, path + '_resized'));
    return uploadImage;
};
module.exports = resourcesServices;