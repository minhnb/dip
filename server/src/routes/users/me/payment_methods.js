'use strict';

const router = require('koa-router')();

const db = require('../../../db');
const entities = require('../../../entities');

const auth = require('../../../helpers/passport_auth');
const validator = require('../../../helpers/input_validator');
const stripe = require('../../../helpers/stripe');

router.post('add payment', '/',
        auth.authenticate(['user:updatePayment']),
        validator({
            request: {
                body: {
                    stripeToken: validator.required(true),
                    default: validator.optional(validator.isBoolean())
                }
            }
        }),
        ctx => {
            let token = ctx.request.body.stripeToken,
                defaultCard = ctx.request.body.default,
                user = ctx.state.user;
            defaultCard = defaultCard === 'true' || defaultCard === '1';
            // How about returning 202 (accepted) immediately without waiting for stripe?
            return stripe.addUserCard(user, token, defaultCard).then(card => {
                if (!card) {
                    ctx.throw(400, 'Card already exists');
                }
                ctx.response.status = 200;
                ctx.body = {newCard: entities.creditCard(card, user.account.defaultCardId)};
            });
        }
    )
    .put('Update default card', '/:cardId/default',
        auth.authenticate(),
        validator({
            request: {
                body: {
                    default: validator.isBoolean()
                }
            }
        }),
        ctx => {
            let cardId = ctx.params.cardId,
                isDefault = ctx.request.body.default,
                user = ctx.state.user;
            isDefault = isDefault === 'true' || isDefault === '1';
            let card = user.account.cards.id(cardId);
            if (!card) {
                ctx.throw(404, 'Invalid card id');
            }
            if (!isDefault) {
                if (card._id.equals(user.account.defaultCardId)) {
                    user.account.defaultCardId = null;
                }
            } else {
                user.account.defaultCardId = card._id;
            }
            return user.save().then(user => {
                return stripe.setDefaultUserCard(user, card).then(() => {
                    ctx.status = 200;
                }) 
            });
        }
    )
    .delete('Delete card', '/:cardId',
        auth.authenticate(),
        ctx => {
            let cardId = ctx.params.cardId,
                user = ctx.state.user;
            let card = user.account.cards.id(cardId);
            if  (!card) {
                ctx.throw(404, 'Invalid card id');
            }
            if (card._id.equals(user.account.defaultCardId)) {
                user.account.defaultCardId = null;
            }
            card.remove();
            return user.save().then(user => {
                ctx.status = 200;
            });
        }
    );


module.exports = router;