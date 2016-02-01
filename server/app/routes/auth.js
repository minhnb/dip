"use strict";

const router = require('koa-router')();
const auth = require('../passport_auth');

const validator = require('../input_validator');
const db = require('../db');

module.exports = router;

router.post('Log in', '/login', auth.login(), ctx => {
    return ctx.state.user.generateJWT().then(token => {
        ctx.response.status = 200;
        ctx.body = { JWT: token };
    });
}).post('Sign up', '/signup', validator({
    request: {
        body: {
            email: validator.isEmail(),
            password: validator.validatePassword,
            firstName: validator.trim(),
            lastName: validator.trim,
            gender: validator.isIn(['male', 'female', 'na'])
        }
    }
}), ctx => {
    var user = new db.users({
        email: ctx.request.body.email,
        firstName: ctx.request.body.firstName,
        lastName: ctx.request.body.lastName,
        gender: ctx.request.body.gender
    });
    return user.setPassword(ctx.request.body.password).then(() => {
        return user.save().then(data => {
            ctx.response.status = 204;
        }).catch(err => {
            if (err.code === 11000) {
                // Duplicate key error -- existed email
                ctx.body = "Email existed";
            }
            throw err;
        });
    }).catch(err => {
        //console.log(err);
        ctx.response.status = 400;
    });
});