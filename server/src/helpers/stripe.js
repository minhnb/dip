'use strict';

const config = require('../config');
const stripe = require('stripe')(config.stripe.key);

// Place any customization here

module.exports = stripe;