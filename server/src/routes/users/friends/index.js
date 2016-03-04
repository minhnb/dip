"use strict";

const router = require('koa-router')();
const url = require('url');

const db = require('../../../db');
const entities = require('../../../entities');
const mailer = require('../../../mailer');
const config = require('../../../config');

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
                    ctx.body = {users: users.map(u => entities.user(u, user))};
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
                if (user._id.equals(friend._id)) {
                    ctx.throw(400, "Can't add yourself as a friend");
                }
                let added = user.friends.addToSet(friend);
                if (added.length > 0) {
                    return user.save().then(() => {
                        mailer.addFriend(friend.email, {
                            name: friend.firstName,
                            actor: user,
                            link: url.format({
                                protocol: 'https',
                                host: config.baseUrl,
                                pathname: `/users/${user._id}`
                            })
                        });
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