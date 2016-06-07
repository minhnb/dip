'use strict';

var environment = (process.env.NODE_ENV || 'development').toLowerCase();

let ttlResetPassword = parseInt(process.env.TTL_RST_PWD) || 24;
let ttlSession = parseInt(process.env.TTL_SESSION) || 72;

module.exports = {
    env: environment,
    baseUrl: process.env.BASE_URL,
    mongo: {
        uri: process.env.MONGO_URI
    },
    ttl: {
        resetPassword: {
            hours: ttlResetPassword,
            seconds: ttlResetPassword * 3600
        },
        session: {
            hours: ttlSession,
            seconds: ttlSession * 3600
        }
    },
    jwt: {
        key: process.env.JWT_KEY,
        algorithm: process.env.JWT_ALG,
        issuer: 'dip'
    },
    stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY
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
    admin: {
        email: process.env.ADMIN_EMAIL
    },
    gcm: {
        apiKey: process.env.GCM_KEY,
        senderId: process.env.GCM_ID
    },
    facebook: {
        appId: process.env.FB_APP_ID,
        secretId: process.env.FB_SECRET_ID
    },
    taxPercent: parseFloat(process.env.TAX_PERCENT)
};