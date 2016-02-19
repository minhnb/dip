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
    },
    stripe: {
        key: process.env.STRIPE_KEY
    },
    aws: {
        region: process.env.AWS_REGION,
        s3Bucket: process.env.S3_BUCKET,
        s3Version: process.env.S3_API_VERSION
    },
    email: {
        server: process.env.MAIL_HOST,
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASS,
        domain: process.env.MAIL_DOMAIN
    }
};