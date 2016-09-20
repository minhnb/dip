"use strict";

const db = require('../db');
const entities = require('../entities');

var geocoderProvider = 'google';
var httpAdapter = 'http';
const geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

const dipConstant = require('../constants/constants');
const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const hotelServiceType = require('../constants/hotelServiceType');
const passType = require('../constants/passType');
const submissionStatus = require('../constants/submissionStatus');
const utils = require('../helpers/utils');

const s3 = require('../helpers/s3');
const crypto = require('crypto');
const url = require('url');

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


/**
 * Hotel Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.createHotel = function (user, hotel) {
    return resourcesServices.dbCreateHotel(hotel, user).then(hotel => {
       return entities.hotel(hotel, user);
    });
};

resourcesServices.getHotelById = function (user, hotelId) {
    return entities.hotel(resourcesServices.dbGetHotelById(hotelId, user), user);
};

resourcesServices.updateHotelImage = function (user, hotelId, img) {
    return resourcesServices.dbUpdateHotelImage(user, hotelId, img).then(hotel => {
        return entities.hotel(hotel, user);
    });
};

resourcesServices.updateHotel = function (user, hotelId, update) {
    return resourcesServices.dbUpdateHotel(user, hotelId, update).then(hotel => {
        return entities.hotel(hotel, user);
    });
};

resourcesServices.updateHotelStatus = function (user, hotelId, active, status) {
    return resourcesServices.dbUpdateHotelStatus(user, hotelId, active, status).then(result => {
        return true;
    });
};

resourcesServices.submitHotel = function (user, hotelId) {
    return resourcesServices.dbSubmitHotel(user, hotelId).then(result => {
        return true;
    });
};

resourcesServices.approveHotel = function (user, hotelId) {
    return resourcesServices.dbUpdateHotelStatus(user, hotelId, undefined, submissionStatus.APPROVED).then(result => {
        return true;
    });
};

resourcesServices.declineHotel = function (user, hotelId, failReason) {
    return resourcesServices.dbUpdateHotelStatus(user, hotelId, undefined, submissionStatus.DECLINED, failReason).then(result => {
        return true;
    });
};

resourcesServices.deleteHotel = function (user, hotelId) {
    return resourcesServices.dbDeleteHotel(user, hotelId).then(result => {
        return true;
    });
};

resourcesServices.getHotelList = function(user, condition) {
    condition = condition || {};
    if (!user.isAdmin()) {
        condition.owner = user;
    }
    return db.hotels.find(condition).exec().then(hotels => {
        return hotels.map(hotel => entities.hotel(hotel, user));
    });
};


/**
 * HotelService Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.createHotelService = function (user, hotelId, hotelService) {
    return resourcesServices.dbCreateHotelService(user, hotelId, hotelService).then(hotelService => {
       return entities.hotelService(hotelService);
    });
};

resourcesServices.getHotelServiceById = async (function (hotelServiceId) {
    return entities.hotelService(resourcesServices.dbGetHotelServiceById(hotelServiceId));
});

resourcesServices.updateHotelServiceImage = function (user, hotelId, hotelServiceId, img) {
    return resourcesServices.dbUpdateHotelServiceImage(user, hotelId, hotelServiceId, img).then(hotelService => {
        return entities.hotelService(hotelService);
    });
};

resourcesServices.updateHotelService = function (user, hotelId, hotelServiceId, update) {
    return resourcesServices.dbUpdateHotelService(user, hotelId, hotelServiceId, update).then(hotelService => {
        return entities.hotelService(hotelService);
    });
};

resourcesServices.deleteHotelService = function (user, hotelId, hotelServiceId) {
    return resourcesServices.dbDeleteHotelService(user, hotelId, hotelServiceId).then(result => {
        return true;
    });
};



/**
 * Offer/Pass Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.createPass = function (user, hotelId, hotelServiceId, offer) {
    return resourcesServices.dbCreatePass(user, hotelId, hotelServiceId, offer).then(offer => {
        return entities.offer(offer);
    });
};

resourcesServices.getPassById = async (function (passId) {
    return entities.offer(resourcesServices.dbGetPassById(passId));
});

resourcesServices.updatePass = async (function (user, passId, pass) {
    return resourcesServices.dbUpdatePass(user, passId, pass).then(offer => {
        return entities.offer(offer);
    })
});

resourcesServices.deletePass = function (user, passId) {
    return resourcesServices.dbDeletePass(user, passId).then(result => {
        return true;
    });
};

resourcesServices.getPassesByHotel = function (hotelId) {
    return resourcesServices.dbGetPassesByHotel(hotelId).then(offers => {
        return offers.map(entities.offer);
    });
};



/**
 * Helper db-hotel Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.dbCreateHotel = function (hotel, user) {
    hotel = resourcesServices.initNormalHotel(hotel);
    if (user.isPartner()) {
        hotel.owner = user._id;
    }
    return hotel.save();
};

resourcesServices.dbUpdateHotelImage = async (function (user, hotelId, img) {
    if (!img) {
        throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
    }
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));
    let uploadImage = await(resourcesServices.uploadHotelImage(img, hotel.name, hotelId, null));
    if (uploadImage) {
        if (hotel.image && hotel.image.url && hotel.image.verified && hotel.image.url != uploadImage.Location) {
            resourcesServices.deleteHotelImage(hotel.image.url);
        }
        hotel.image = {
            url: uploadImage.Location,
            verified: true
        };
        return hotel.save();
    } else {
        throw new DIPError(dipErrorDictionary.S3_ERROR);
    }
});

resourcesServices.dbGetHotelById = function (hotelId, user) {
    let condition = {
        _id: hotelId,
        deleted: false
    };
    if (!user) {
        condition.active = true;
    } else if (!user.isAdmin()) {
        condition['$or'] = [
            {owner: user._id},
            {active: true}
        ];
    }
    let hotel = await(db.hotels.findOne(condition)
        .populate({
            path: 'services',
            model: db.hotelServices
        }));
    if (!hotel) {
        throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
    }
    return hotel;
};

resourcesServices.dbUpdateHotel = async (function (user, hotelId, update) {
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));

    if (hotel.submission.status == submissionStatus.PENDING) {
        throw new DIPError(dipErrorDictionary.CANNOT_CHANGE_PENDING_HOTEL);
    }
    hotel = resourcesServices.initNormalHotel(update, hotel);
    return hotel.save();
});

resourcesServices.dbUpdateHotelStatus = async (function (user, hotelId, active, status, failReason) {
    let hotel = await (_checkHotelPermission(user, hotelId));
    if (hotel.submission.status != submissionStatus.PENDING) {
        throw new DIPError(dipErrorDictionary.HOTEL_IS_NOT_PENDING_HOTEL);
    }
    if (status != submissionStatus.APPROVED && status != submissionStatus.DECLINED) {
        throw new DIPError(dipErrorDictionary.HOTEL_STATUS_MUST_BE_APPROVED_OR_DECLINED);
    }
    if (status == submissionStatus.DECLINED && !failReason) {
        throw new DIPError(dipErrorDictionary.HOTEL_NEED_FAIL_REASON);
    }
    if (active === undefined) {
        if (status == submissionStatus.APPROVED) {
            active = true;
        } else {
            active = hotel.active;
        }
    }
    active = active ? true : false;
    if (active && status == submissionStatus.APPROVED && !hotel.dipLocation) {
        throw new DIPError(dipErrorDictionary.HOTEL_NEED_LOCATION_BEFORE_APPROVE);
    }
    if (!active && status == submissionStatus.APPROVED) {
        throw new DIPError(dipErrorDictionary.HOTEL_INVALID_STATUS);
    }
    let update = {active: active, 'submission.status': status};
    if (active && hotel.active && status == submissionStatus.APPROVED) {
        let pendingContent = hotel.pendingContent.toObject();
        let hotelHasPendingContent = hotel.hasPendingContent;
        if (hotelHasPendingContent) {
            for (var key in pendingContent) {
                if (!utils.isEmptyObject(pendingContent[key])) {
                    update[key] = pendingContent[key];
                }
            }
            update.pendingContent = {};
        } else {
            throw new DIPError(dipErrorDictionary.HOTEL_ALREADY_APPROVED);
        }
    }
    if (status == submissionStatus.DECLINED) {
        update['submission.failReason'] = failReason;
    }
    return db.hotels.update({_id: hotel._id}, update);
});

resourcesServices.dbSubmitHotel = async (function (user, hotelId) {
    let hotel = await (_checkHotelPermission(user, hotelId));
    let hotelHasPendingContent = hotel.hasPendingContent;
    if (hotel.submission.status == submissionStatus.PENDING
        || (hotel.submission.status == submissionStatus.APPROVED && !hotelHasPendingContent)) {
        throw new DIPError(dipErrorDictionary.HOTEL_CAN_NOT_SUBMIT_APPROVED_OR_PENDING_HOTEL);
    }
    return db.hotels.update({_id: hotel._id}, {'submission.status': submissionStatus.PENDING});
});

resourcesServices.dbDeleteHotel = async (function (user, hotelId) {
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));
    return db.hotels.update({_id: hotel._id}, {deleted: true});
});

resourcesServices.getExistedHotel = function (hotelId) {
    let hotel = await(db.hotels.findById(hotelId));
    if (!hotel || hotel.deleted) {
        throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
    }
    return hotel;
};



/**
 * Helper db-hotelservice Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.dbCreateHotelService = async (function (user, hotelId, hotelService) {
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));
    hotelService = resourcesServices.initNormalHotelService(hotelService);
    let newHotelService;
    if (hotelService.type == hotelServiceType.POOL_SERVICE) {
        newHotelService = db.poolServices(hotelService);
    } else  {
        newHotelService = db.hotelServices(hotelService);
    }
    return newHotelService.save().then((hotelService) => {
        return db.hotels.update({_id: hotel._id}, {$addToSet: {services: newHotelService}}).then((result) => {
            return hotelService;
        });
    });
});

resourcesServices.dbUpdateHotelServiceImage = async (function (user, hotelId, hotelServiceId, img) {
    if (!img) {
        throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
    }
    let hotel = await (_checkHotelPermission(user, hotelId));
    let hotelService = resourcesServices.getExistedHotelService(hotelServiceId, hotel);
    let uploadImage = await(resourcesServices.uploadHotelImage(img, hotelService.name, hotelServiceId, hotelService.type));
    if (uploadImage) {
        if (hotelService.image && hotelService.image.url && hotelService.image.verified && hotelService.image.url != uploadImage.Location) {
            resourcesServices.deleteHotelImage(hotelService.image.url);
        }
        hotelService.image = {
            url: uploadImage.Location,
            verified: true
        };
        return hotelService.save();
    } else {
        throw new DIPError(dipErrorDictionary.S3_ERROR);
    }
});

resourcesServices.dbGetHotelServiceById = function (hotelServiceId) {
    let hotelService = resourcesServices.getExistedHotelService(hotelServiceId);
    return hotelService;
};

resourcesServices.dbUpdateHotelService = async (function (user, hotelId, hotelServiceId, update) {
    let hotel = await (_checkHotelPermission(user, hotelId));
    let hotelService = resourcesServices.getExistedHotelService(hotelServiceId, hotel);
    update = resourcesServices.initNormalHotelService(update);
    for (let key in update) {
        hotelService[key] = update[key];
    }
    return hotelService.save();
});

resourcesServices.dbDeleteHotelService = async (function (user, hotelId, hotelServiceId) {
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));
    let hotelService = resourcesServices.getExistedHotelService(hotelServiceId);
    if (hotel.services.indexOf(hotelService._id) == -1) {
        throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);
    }
    return db.hotels.update({_id: hotel._id}, {$pull: {services: hotelService._id}}).then((result) => {
        return db.hotelServices.update({_id: hotelService._id}, {deleted: true}).then((hotelService) => {
            return hotelService;
        });
    });
});

resourcesServices.getExistedHotelService = function (hotelServiceId, hotel) {
    let hotelService = await(db.hotelServices.findById(hotelServiceId));
    if (!hotelService || hotelService.deleted
        || (hotel && hotel.services.indexOf(hotelService._id) == -1)) {
        throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);
    }
    return hotelService;
};



/**
 * Helper db-offer Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.dbCreatePass = async (function (user, hotelId, hotelServiceId, offer) {
    // let hotel = resourcesServices.getExistedHotel(hotelId);
    let hotel = await (_checkHotelPermission(user, hotelId));
    let hotelService = resourcesServices.getExistedHotelService(hotelServiceId, hotel);
    // if (hotel.services.indexOf(hotelService._id) == -1) {
    //     throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);
    // }
    offer = resourcesServices.initNormalPass(offer);
    offer.hotel = hotelId;
    offer.service = hotelServiceId;
    let newOffer = db.offers(offer);
    return newOffer.save();
});

resourcesServices.dbGetPassById = function (passId) {
    let pass = resourcesServices.getExistedPass(passId);
    return pass;
};

resourcesServices.dbUpdatePass = function (user, passId, update) {
    let pass = resourcesServices.getExistedPass(passId, user);
    update = resourcesServices.initNormalPass(update);
    if (update.service != undefined && update.service != pass.service) {
        let hotel = resourcesServices.getExistedHotel(pass.hotel);
        let hotelService = resourcesServices.getExistedHotelService(update.service);
        if (hotel.services.indexOf(hotelService._id) == -1) {
            throw new DIPError(dipErrorDictionary.SERVICE_NOT_FOUND);
        }
    }
    for (let key in update) {
        pass[key] = update[key];
    }
    return pass.save();
};

resourcesServices.dbDeletePass = async (function (user, passId) {
    let pass = resourcesServices.getExistedPass(passId, user);
    if (resourcesServices.isDeletablePass(pass)) {
        return db.offers.update({_id: pass._id}, {deleted: true});
    }
    return Promise.resolve();
});

resourcesServices.dbGetPassesByHotel = function (hotelId) {
    let hotel = resourcesServices.getExistedHotel(hotelId);
    return db.offers.find({hotel: hotelId});
};

resourcesServices.getExistedOffer = async (function (offerId, type) {
    let offer = await(db.offers.findById(offerId));
    let offerError = dipErrorDictionary.OFFER_NOT_FOUND;
    if (type == 'pass') {
        offerError = dipErrorDictionary.PASS_NOT_FOUND;
    }
    if (!offer || offer.deleted) {
        throw new DIPError(offerError);
    }
    if (offer.type != type) {
        throw new DIPError(offerError);
    }
    return offer;
});

resourcesServices.getExistedPass = function (passId, user) {
    let pass = await (resourcesServices.getExistedOffer(passId, 'pass'));
    let hotel = await (db.hotels.findById(pass.hotel).exec());
    if (user && user.isPartner() && !user._id.equals(hotel.owner)) {
        throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
    }
    return pass;
};



/**
 * Helper miscellaneous/initialization Methods
 *
 -------------------------------------------------------------------------*/

resourcesServices.initNormalHotel = function (update, hotel) {
    update = utils.trimObject(update, true);
    if (!utils.isEmptyObject(update.address)) {
        update.coordinates = await(resourcesServices.getHotelCoordinates(update.address));
    } else {
        delete update.address;
        delete update.coordinates;
    }

    let criticalFields = ['name', 'address', 'coordinates', 'dipLocation'];
    let initFields = ['url', 'instagram', 'phone', 'roomService'];

    if (!hotel) {
        // Initialize default values if creating new hotel
        hotel = new db.hotels({
            featured: false,
            reservable: false,
            active: false,
            submission: {
                status: submissionStatus.INITIAL
            },
            banned: {
                status: false
            }
        });
    }
    let hotelData = hotel.toObject();
    criticalFields.forEach(field => {
        if (update[field] !== undefined) {
            if (hotel.active) {
                if (utils.compareObject(hotelData[field], update[field])) {
                    delete hotel.pendingContent[field];
                } else {
                    hotel.pendingContent[field] = update[field];
                }
            } else {
                hotel[field] = update[field];
            }
        }
    });
    initFields.forEach(field => {
        if (update[field] !== undefined) hotel[field] = update[field];
    });

    return hotel;
};

resourcesServices.getHotelCoordinates = function (address) {
    let parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    let fullAddress = parts.join(', ');
    return geocoder.geocode(fullAddress)
    .then(data => {
        if (data.length == 0) {
            throw new DIPError(dipErrorDictionary.HOTEL_ADDRESS_NOT_FOUND);
        }
        let coordinates = [];
        coordinates.push(data[0].longitude);
        coordinates.push(data[0].latitude);
        return coordinates;
    });
};

resourcesServices.uploadHotelImage = function (img, hotelName, hotelId, serviceType) {
    let key = 'hotels';
    if (serviceType) {
        switch (serviceType) {
            case hotelServiceType.POOL_SERVICE:
                key = 'pools';
                break;
            case hotelServiceType.SPA_SERVICE:
                key = 'spas';
                break;
            case hotelServiceType.RESTAURANT_SERVICE:
                key = 'restaurants';
                break;
            default:
        }
    }
    let hash = crypto.createHash('md5').update(img.buffer).digest("hex");
    let path = key + '/' + hotelName.replace(/ /g, "_").toLowerCase() + '_' + hotelId + '_' + hash;
    let uploadImage = await(s3.uploadResizedImage(img, undefined, path));
    let uploadResizedImage = await(s3.uploadResizedImage(img, dipConstant.HOTEL_IMAGE_WIDTH, path + '_resized'));
    return uploadImage;
};

resourcesServices.deleteHotelImage = function (imageURL) {
    if (!imageURL) {
        return;
    }
    try {
        let path = url.parse(imageURL).pathname.substr(1);
        let paths = [path, path + '_resized'];
        let deletedHotelImages = await(s3.deleteImages(paths));
    } catch (ex) {
        console.log(ex);
        throw new DIPError(dipErrorDictionary.S3_ERROR);
    }
};

resourcesServices.initNormalHotelService = function (hotelService) {
    if (hotelService._id) {
        delete hotelService._id;
    }
    if (hotelService.image) {
        delete hotelService.image;
    }
    if (hotelService.reservable == undefined) {
        hotelService.reservable = false;
    }
    if (hotelService.type) {
        let hotelServiceTypes = utils.objectToArray(hotelServiceType);
        let type = hotelService.type + 'Service';
        if (hotelServiceTypes.indexOf(type) > -1) {
            hotelService.type = type;
        }
    }
    return hotelService;
};

resourcesServices.initNormalPass = function (offer) {
    if (offer._id) {
        delete offer._id;
    }
    if (offer.baseId) {
        delete offer.baseId;
    }
    // if (offer.service) {
    //     delete offer.service;
    // }
    if (offer.hotel) {
        delete offer.hotel;
    }
    if (offer.reservationCount) {
        delete offer.reservationCount;
    }
    if (offer.pendingReservationCount) {
        delete offer.pendingReservationCount;
    }
    offer.type = 'pass';
    if (offer.passType) {
        if (!offer.description) {
            offer.description = offer.passType;
        }
        offer.amenities = resourcesServices.getAmenitiesByPassType(offer.passType);
    }
    return offer;
};

resourcesServices.getAmenitiesByPassType = function (offerPassType) {
    let amenity = offerPassType;
    if (amenity == passType.PASS_TYPE_POOL_PASS) {
        amenity = hotelServiceType.POOL_SERVICE;
    }
    let amenities = [amenity.toLowerCase()];
    return amenities;
};

resourcesServices.isDeletablePass = function (offer) {
    return true;
};

function _checkHotelPermission(user, hotelId) {
    let condition = {_id: hotelId, deleted: false};
    if (user.isPartner()) {
        condition.owner = user;
    }
    return db.hotels.findOne(condition).exec().then(hotel => {
        if (!hotel) {
            throw new DIPError(dipErrorDictionary.HOTEL_NOT_FOUND);
        }
        return hotel;
    });
}

module.exports = resourcesServices;