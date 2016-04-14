'use strict';

const randomstring = require('randomstring');
const dateformat = require('dateformat');
const md5 = require('md5');

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
        ctx.throw(403); // access denied
    }
}

function isAdmin(ctx, next) {
    if(ctx.state.user && ctx.state.user.role == 'admin') {
        return next();
    } else{
        ctx.throw(401);
    }
}

function generateMemberCode(prefix, codeLength) {
    let timestamp = Date.now();
    let hash = md5(prefix.concat(timestamp));
    let code = hash.substr(hash.length - codeLength, codeLength);
    return code;
}

module.exports = {
    generateToken: generateRandomToken,
    convertDate: convertDate,
    convertCardExpireDate: convertCardExpireDate,
    checkGroupOwner: checkGroupOwner,
    isAdmin: isAdmin,
    generateMemberCode: generateMemberCode
};
