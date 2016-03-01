"use strict";

const router = require('koa-router')();
const db = require('../../../db');
const entities = require('../../../entities');

const auth = require('../../../helpers/passport_auth');

module.exports = router;

router.use('/', auth.authenticate())
    .get('search friends', '/',
        ctx => {
            let user = ctx.state.user,
                query = ctx.query.query,
                userOpts = {
                    _id: {$in: user.friends}
                };
            if (query) {
                userOpts['$text'] = {$search: query};
            }
            return db.users.find(userOpts)
                .then(users => {
                    ctx.body = {users: users.map(entities.user)};
                });
        }
    )
    .post('add friend', '/',
        ctx => {
            let userId = ctx.request.body.userId,
                email = ctx.request.body.email,
                user = ctx.state.user,
                p;

            // Prioritize userId over email
            if (userId) {
                p = db.users.findById(userId).exec();
            } else if (email) {
                p = db.users.findByEmail(email).exec();
            } else {
                ctx.throw(400, 'Missing user id and email');
            }

            return p.then(friend => {
                if (!friend) {
                    ctx.throw(404, 'Invalid user');
                }
                let added = user.friends.addToSet(friend);
                if (added.length > 0) {
                    return user.save().then(() => {
                        // TODO: Send notification to other user
                        // <Blah Blah> added you as his/her/their friend
                        ctx.status = 200;
                    });
                } else {
                    ctx.status = 200;
                }
            });

        }
    )
    .delete('Remove friend', '/:friendId',
        ctx => {
            let user = ctx.state.user,
                friendId = ctx.params.friendId;
            user.friends.pull(friendId);
            return user.save().then(() => {
                ctx.status = 200;
            });
        }
    );

module.exports = router;