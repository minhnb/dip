'use strict';

const fs = require('fs');
const path = require('path');

const Handlebars = require('handlebars');

function compileTemplate(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, source) => {
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
    return compileTemplate(path.join(emailTemplateRoot, fileName)).then(template => {
        return template(data);
    });
}

const emailTemplateRoot = path.join(__dirname, 'templates');

module.exports = {
    resetPassword: data => parseTemplate('resetPassword.html', data),
    welcome: data => parseTemplate('welcome.html', data)
};