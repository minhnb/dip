'use strict';

var config = require('../config');
var stripe = require('stripe')(config.stripe.key);

// Place any customization here

module.exports = stripe;