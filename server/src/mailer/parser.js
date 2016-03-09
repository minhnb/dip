'use strict';

const Handlebars = require('handlebars');

function parseTemplate(data, source) {
    return Handlebars.compile(source)(data);
}

Handlebars.registerHelper('hour_convert', function(minute) {
    var m = minute % 60;
    var h = (minute-m)/60;

    var hrsMins = h.toString() + ":" + (m<10?"0":"") + m.toString();
    console.log(hrsMins);
    return hrsMins;
});
module.exports = parseTemplate;