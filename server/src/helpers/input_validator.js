'use strict';

const convert = require('koa-convert');
const validator = require('koa-router-validator');
//const merge = require('merge-descriptors');

function validatorWrapper() {
    return convert(validator(...arguments));
}

function validatePassword(pwd) {
    if (pwd && pwd.length >= 6 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
        return true;
    } else {
        throw new Error('Invalid password');
    }
}

// Kind of silly but it works
function optional(verifier) {
    return function(data) {
        return (data === undefined) || verifier(data);
    };
}

function required(strong) {
    return (data => {
        return data !== undefined && (!strong || (data !== null && data !== ''));
    });
}

// Map necessary validator functions to wrapper (and enable IDE's code-hint also)
validatorWrapper.isAlphanumeric = validator.isAlphanumeric;
validatorWrapper.isNumeric = validator.isNumeric;
validatorWrapper.isMongoId = validator.isMongoId;
validatorWrapper.isURL = validator.isURL;
validatorWrapper.isInt = validator.isInt;
validatorWrapper.isDecimal = validator.isDecimal;
validatorWrapper.isBoolean = validator.isBoolean;
validatorWrapper.isDate = validator.isDate;
validatorWrapper.isEmail = validator.isEmail;
validatorWrapper.isJSON = validator.isJSON;
validatorWrapper.isIn = validator.isIn;
validatorWrapper.toInt = validator.toInt;
validatorWrapper.toFloat = validator.toFloat;
validatorWrapper.toBoolean = validator.toBoolean;
validatorWrapper.toDate = validator.toDate;
validatorWrapper.normalizeEmail = validator.normalizeEmail;
validatorWrapper.trim = validator.trim;
validatorWrapper.validatePassword = validatePassword;
validatorWrapper.optional = optional;
validatorWrapper.required = required;

module.exports = validatorWrapper;
