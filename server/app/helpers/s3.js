'use strict';

var AWS = require('aws-sdk');

var config = require('../config');

AWS.config.update({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.secret,
    region: config.aws.region
});

var s3 = new AWS.S3({
    params: {
        Bucket: config.aws.s3Bucket,
        apiVersion: config.aws.s3Version
    }
});

function getSignedUrl(key, md5) {
    var params = { Key: key, ACL: 'public-read' };
    if (md5) {
        params.ContentMD5 = md5;
    }
    return s3.getSignedUrl('putObject', params);
}

function upload(key, data, contentType) {
    return new Promise(function (resolve, reject) {
        var payload = {
            Key: key,
            Body: data,
            ACL: 'public-read'
        };
        if (contentType) {
            payload.ContentType = contentType;
        }
        s3.upload(payload, function (error, data) {
            if (!error) resolve(data);else reject(error);
        });
    });
}

module.exports = {
    s3: s3,
    getSignedUrl: getSignedUrl,
    upload: upload
};