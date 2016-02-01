const merge = require('lodash.merge');

var environment = process.env.NODE_ENV;

var config = {
    env: environment,
    mongo: {},
    jwt: {
        key: 'default key',
        algorithm: 'HS256',
        issuer: 'dip'
    }
};

module.exports = merge(config, require('./' + environment + '.js') || {});