'use strict';

var environment = (process.env.NODE_ENV || 'development').toLowerCase();

module.exports = {
    env: environment,
    baseUrl: process.env.BASE_URL,
    mongo: {
        uri: process.env.MONGO_URI
    },
    ttl: {
        resetPassword: {
            hours: process.env.TTL_RST_PWD,
            seconds: process.env.TTL_RST_PWD * 3600
        },
        session: {
            hours: process.env.TTL_SESSION,
            seconds: process.env.TTL_SESSION * 3600
        }
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
        key: process.env.AWS_ACCESS_KEY,
        secret: process.env.AWS_SECRET,
        s3Bucket: process.env.S3_BUCKET,
        s3Version: process.env.S3_API_VERSION
    },
    email: {
        server: process.env.MAIL_HOST,
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASS,
        domain: process.env.MAIL_DOMAIN,
        address: process.env.MAIL_ADDRESS
    },
    gcm: {
        apiKey: process.env.GCM_KEY,
        senderId: process.env.GCM_ID
    }
};