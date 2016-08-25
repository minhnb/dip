"use strict";

const router = require('koa-router')();
const url = require('url');

const validator = require('../validators');

const auth = require('../auth');

module.exports = router;

router
    .post('Log in', '/login', auth.login, auth.setupAccessToken)
    .post('Facebook Log-in', '/fblogin', auth.facebookLogin, auth.setupAccessToken)
    .post('Sign up', '/signup', validator.auth.signup(), auth.signup)
    .post('Sign out', '/logout', auth.authenticate(), auth.deleteSession)
    .post('/refreshtoken', auth.refreshAccessToken);