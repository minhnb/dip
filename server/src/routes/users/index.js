"use strict";

const router = require('koa-router')();
const db = require('../../db');
const entities = require('../../entities');

const auth = require('../../helpers/passport_auth');
const validator = require('../../helpers/input_validator');

const meRouter = require('./me');
const friendRouter = require('./friends');

module.exports = router;

router.use('/', auth.authenticate())
    .get('search user', '/',
        auth.authenticate(),
        ctx => {
            let user = ctx.state.user,
                query = ctx.query.query,
                userOpts = {
                    $or: [
                        {privateMode: false},
                        {
                            _id: {$in: user.friends}
                        }
                    ]
                };
            if (query) {
                userOpts['$text'] = {$search: query};
            }
            return db.users.find(userOpts)
                .then(users => {
                ctx.body = {users: users.map(u => entities.user(u, user))};
            });
        }
    )
    .use('/friends', friendRouter.routes(), friendRouter.allowedMethods())
    .use('/me', meRouter.routes(), meRouter.allowedMethods())
    .get('get user', '/:username',
        ctx => {
            return db.users.findByEmail(ctx.params.username)
                .exec()
                .then(user => {
                    if (!user) {
                        //ctx.body = {user: null, error: 'Invalid user'};
                        ctx.response.status = 404;
                    } else {
                        ctx.body = {user: entities.user(user, ctx.state.user)};
                    }
                });
        }
    );
