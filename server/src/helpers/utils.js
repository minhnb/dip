const randomstring = require('randomstring');
const dateformat = require('dateformat');

function generateRandomToken(length) {
    return randomstring.generate(length);
}

function convertDate(dateString) {
    var date = new Date(dateString);
    return dateformat(date, 'yyyy-mm-dd');
}
function convertCardExpireDate(year, month) {
    var date = new Date(year, month);
    return dateformat(date, 'mm/yyyy');
}

module.exports = {
    generateToken: generateRandomToken,
    convertDate: convertDate,
    convertCardExpireDate: convertCardExpireDate
};
