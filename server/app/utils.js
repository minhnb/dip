const randomstring = require('randomstring');

function generateRandomToken(length) {
    return randomstring.generate(length);
}

exports.generateToken = generateRandomToken;