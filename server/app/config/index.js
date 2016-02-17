'use strict';

var environment = process.env.NODE_ENV || 'development';
environment = environment.toLowerCase();

module.exports = {
    env: environment,
    mongo: {
        uri: process.env.URI
    },
    jwt: {
        key: process.env.JWT_KEY,
        algorithm: process.env.JWT_ALG,
        issuer: 'dip'
    }
};