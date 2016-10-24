'use strict';

const randomstring = require('randomstring');
const dateformat = require('dateformat');
const md5 = require('md5');
const config = require('../config');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');
const userRole = require('../constants/userRole');

function generateRandomToken(length) {
    return randomstring.generate(length);
}

function convertDate(dateString) {
    if (!dateString) return null;
    var date = new Date(dateString);
    return dateformat(date, 'yyyy-mm-dd');
}
function formatMoment(m) {
    return m.format('YYYY-MM-DD');
}
function convertCardExpireDate(year, month) {
    var date = new Date(year, month);
    return dateformat(date, 'mm/yyyy');
}

function checkGroupOwner(ctx, next) {
    if (ctx.state.user && ctx.state.user._id.equals(ctx.state.group.owner)) {
        return next();
    } else {
        // ctx.throw(403); // access denied
        throw new DIPError(dipErrorDictionary.ACCESS_DENIED);
    }
}

function isAdmin(ctx, next) {
    if(ctx.state.user && ctx.state.user.role.indexOf(userRole.ADMIN) > -1) {
        return next();
    } else{
        // ctx.throw(401);
        throw new DIPError(dipErrorDictionary.UNAUTHORIZED);
    }
}

function generateMemberCode(prefix, codeLength) {
    let timestamp = Date.now();
    let hash = md5(prefix.concat(timestamp));
    let code = hash.substr(hash.length - codeLength, codeLength);
    return code;
}

function isDipSupportedLocation(dipLocation, ctx) {
    if (ctx.supportedLocations.has(dipLocation)) {
        return true;
    }
    return false;
}

function isTestEmail(email, ctx) {
    if (ctx.testEmails.has(email)) {
        return true;
    }
    return false;
}

function calculateTax(total) {
    let taxPercent = config.taxPercent;
    return Math.round(taxPercent * total / 100);
}

function calculatePriceIncludeTax(total) {
    return (total + calculateTax(total));
}

function getFullName(listNames, separator) {
    return listNames.filter(Boolean).join(separator);
}

function getHotelDisplayName(hotel) {
    if (!hotel) return '';
    return hotel.name;
    // let listNames = [];
    // listNames.push(hotel.name);
    // if (hotel.address) {
    //     listNames.push(hotel.address.neighborhood);
    // }
    // return getFullName(listNames, ", ");
}

function objectToArray(object) {
    let result = [];
    for (var key in object) {
        result.push(object[key]);
    }
    return result;
}

function isEmptyObject(object) {
    return !object
        || (Array.isArray(object) && object.length == 0)
        || (typeof object == 'object' && Object.keys(object).length == 0);
}

function trimObject(object, forced) {
    if (Array.isArray(object)) {
        // Checking for array first because typeof [] == 'object'
        // Iterate through array, trimming each item
        return object.map(val => trimObject(val));
    } else if (object === null || object === undefined) {
        // Checking for null first because typeof null == 'object'
        // Convert null / undefined to empty string if forced is passed in
        if (forced) return '';
        else return object;
    } else if (typeof object == 'object') {
        // Iterate through object, trimming each item
        let clone = {};
        Object.keys(object).forEach(key => {
            clone[key] = trimObject(object[key]);
        });
        return clone;
    } else if (typeof object == 'string') {
        // trimming string
        return object.trim();
    } else {
        // otherwise, simply return object (can be number, boolean, ...)
        return object;
    }
}

function compareObject(obj1, obj2) {
    if (Array.isArray(obj1) + Array.isArray(obj2) === 1) {
        // If only 1 of them is array, return false
        // Checking using js type-coercing
        return false;
    } else if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) return false;
        for (let i = 0; i < obj1.length; i++) {
            if (!compareObject(obj1[i], obj2[i])) return false;
        }
    } else if (obj1 === null || obj2 === null) {
        // Special case: checking for null first because typeof null == 'object'
        return obj1 === obj2;
    } else if (typeof obj1 !== typeof obj2) {
        return false;
    } else if (typeof obj1 == 'object') {
        let keys1 = Object.keys(obj1).sort(),
            keys2 = Object.keys(obj2).sort();
        if (!compareObject(keys1, keys2)) return false;
        for (let i = 0; i < keys1.length; i++) {
            let key = keys1[i];
            if (!compareObject(obj1[key], obj2[key])) return false;
        }
    } else return obj1 === obj2;

    // all tests passed
    return true;
}

function hasDuplicateElement(firstArray, secondArray) {
    return firstArray.some(value => {
        return secondArray.indexOf(value) > -1;
    });
}

module.exports = {
    generateToken: generateRandomToken,
    convertDate: convertDate,
    formatMomentDate: formatMoment,
    convertCardExpireDate: convertCardExpireDate,
    checkGroupOwner: checkGroupOwner,
    isAdmin: isAdmin,
    generateMemberCode: generateMemberCode,
    isDipSupportedLocation: isDipSupportedLocation,
    isTestEmail: isTestEmail,
    calculateTax: calculateTax,
    calculatePriceIncludeTax: calculatePriceIncludeTax,
    getFullName: getFullName,
    getHotelDisplayName: getHotelDisplayName,
    objectToArray: objectToArray,
    isEmptyObject: isEmptyObject,
    trimObject: trimObject,
    compareObject: compareObject,
    hasDuplicateElement: hasDuplicateElement
};