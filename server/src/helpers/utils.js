'use strict';

const randomstring = require('randomstring');
const dateformat = require('dateformat');
const md5 = require('md5');
const config = require('../config');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

function generateRandomToken(length) {
    return randomstring.generate(length);
}

function convertDate(dateString) {
    if (!dateString) return null;
    var date = new Date(dateString);
    return dateformat(date, 'yyyy-mm-dd');
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
    if(ctx.state.user && ctx.state.user.role == 'admin') {
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
    let listNames = [];
    listNames.push(hotel.name);
    if (hotel.address) {
        listNames.push(hotel.address.neighborhood);
    }
    return getFullName(listNames, ", ");
}

function objectToArray(object) {
    let result = [];
    for (var key in object) {
        result.push(object[key]);
    }
    return result;
}

module.exports = {
    generateToken: generateRandomToken,
    convertDate: convertDate,
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
    objectToArray: objectToArray
};