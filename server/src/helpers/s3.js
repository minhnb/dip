'use strict';

const AWS = require('aws-sdk');

const config = require('../config');

AWS.config.region = config.aws.region;
const s3 = AWS.S3({params: {Bucket: config.aws.s3Bucket, apiVersion: config.aws.s3Version}});

function getSignedUrl(key, md5) {
    var params = {Key: key, ACL: 'public-read'};
    if (md5) {
        params.ContentMD5 = md5;
    }
    return s3.getSignedUrl('putObject', params);
}

function upload(key, data) {
    return new Promise((resolve, reject) => {
        s3.upload({Key: key, Body: data, ACL: 'public-read'}, (error, data) => {
            if (!error) resolve(data);
            else reject(error);
        });
    });
}

module.exports = {
    s3: s3,
    getSignedUrl: getSignedUrl,
    upload: upload
};