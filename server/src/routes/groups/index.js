'use strict';

const router = require('koa-router')();

const db = require('../../db');
const auth = require('../../helpers/passport_auth');

const groupHandler = require('./group.handler');
const messageHandler = require('./message.handler');

module.exports = router;

router.use('/', auth.authenticate())
    .get('/', groupHandler.getGroups)
    .post('/', groupHandler.addGroup) // @deprecated
    .post('/contactdip', groupHandler.contactDip)
    .get('/:groupId', groupHandler.authenticateGroup, groupHandler.getGroup)
    .get('/:groupId/messages', groupHandler.authenticateGroup, messageHandler.getMessages)
    .get('/:groupId/members', groupHandler.authenticateGroup, groupHandler.getMembers)
    .put('/:groupId/seen', groupHandler.authenticateGroup, groupHandler.updateSeen)
    .post('/:groupId/messages', groupHandler.authenticateGroup, messageHandler.createMessage) // @deprecated
    .post('/messages', groupHandler.createOrAuthenticateGroup, messageHandler.createMessage);
