'use strict';

var env = {
    mongo: {
        uri: 'mongodb://localhost/test_db'
    },
    jwt: {
        key: 'my secret key',
        algorithm: 'HS256'
    }
};

module.exports = env;