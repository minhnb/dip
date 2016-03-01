'use strict';

const Handlebars = require('handlebars');

function parseTemplate(data, source) {
    return Handlebars.compile(source)(data);
}

module.exports = parseTemplate;