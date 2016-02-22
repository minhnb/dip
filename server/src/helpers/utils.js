const randomstring = require('randomstring');
const dateformat = require('dateformat');

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
    if (ctx.state.user && ctx.state.user._id.equals(ctx.state.group.owner._id)) {
        return next();
    } else {
        ctx.throw(403); // access denied
    }
}

module.exports = {
    generateToken: generateRandomToken,
    convertDate: convertDate,
    convertCardExpireDate: convertCardExpireDate,
    checkGroupOwner: checkGroupOwner
};
