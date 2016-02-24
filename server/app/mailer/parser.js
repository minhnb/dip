'use strict';

var fs = require('fs');
var path = require('path');

var Handlebars = require('handlebars');

function compileTemplate(filePath) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, 'utf-8', function (err, source) {
            if (err) {
                console.error(__filename, 'compileTemplate.readFile error', err);
                reject(err);
            } else {
                resolve(Handlebars.compile(source));
            }
        });
    });
}

function parseTemplate(fileName, data) {
    return compileTemplate(path.join(emailTemplateRoot, fileName)).then(function (template) {
        return template(data);
    });
}

var emailTemplateRoot = path.join(__dirname, 'templates');

module.exports = {
    resetPassword: function resetPassword(data) {
        return parseTemplate('resetPassword.html', data);
    },
    welcome: function welcome(data) {
        return parseTemplate('welcome.html', data);
    }
};