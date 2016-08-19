'use strict';

const AWS = require('aws-sdk');

const config = require('../config');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

const imageUtils = require('../helpers/image');

AWS.config.update({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.secret,
    region: config.aws.region
});

const s3 = new AWS.S3({
    params: {
        Bucket: config.aws.s3Bucket,
        apiVersion: config.aws.s3Version
    }
});

function getSignedUrl(key, md5) {
    var params = {Key: key, ACL: 'public-read'};
    if (md5) {
        params.ContentMD5 = md5;
    }
    return s3.getSignedUrl('putObject', params);
}

function upload(key, data, contentType) {
    return new Promise((resolve, reject) => {
        let payload = {
            Key: key,
            Body: data,
            ACL: 'public-read'
        };
        if (contentType) {
            payload.ContentType = contentType;
        }
        s3.upload(payload, (error, data) => {
            if (!error) resolve(data);
            else reject(error);
        });
    });
}

function uploadResizedImage(img, resizedWidth, path) {
    if (!img) {
        throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
    } else {
        return imageUtils.resize(img.buffer, resizedWidth, 'jpg')
            .then(data => {
                let contentType = 'image/jpg';
                return upload(path, data, contentType)
                    .catch(err => {
                        console.error(err);
                        throw new DIPError(dipErrorDictionary.S3_ERROR);
                    }).then(data => {
                        return data;
                    });
            });
    }
}

function uploadResizedImage(img, resizedWidth, path) {
    if (!img) {
        throw new DIPError(dipErrorDictionary.NO_IMAGE_SPECIFIED);
    } else {
        return imageUtils.resize(img.buffer, resizedWidth, 'jpg')
            .then(data => {
                let contentType = 'image/jpg';
                return upload(path, data, contentType)
                    .catch(err => {
                        console.error(err);
                        throw new DIPError(dipErrorDictionary.S3_ERROR);
                    }).then(data => {
                        return data;
                    });
            });
    }
}

function deleteImage(path) {
    return new Promise((resolve, reject) => {
        let params = {
            Key: path
        };
        s3.deleteObject(params, (error, data) => {
            if (!error) resolve(data);
            else reject(error);
        });
    });
}

function deleteImages(paths) {
    return new Promise((resolve, reject) => {
        let objects = paths.map(path => {
                return {Key: path};
            });
        let params = {
            Delete: {
                Objects: objects,
                Quiet: true
            }
        };
        s3.deleteObjects(params, (error, data) => {
            if (!error) resolve(data);
            else reject(error);
        });
    });
}

module.exports = {
    s3: s3,
    getSignedUrl: getSignedUrl,
    upload: upload,
    uploadResizedImage: uploadResizedImage,
    deleteImage: deleteImage,
    deleteImages: deleteImages
};