'use strict';

const router = require('koa-router')();
const multer = require('koa-multer');
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
    .delete('/:groupId', groupHandler.authenticateGroup, groupHandler.leaveGroup) // @deprecated
    .get('/:groupId/messages', groupHandler.authenticateGroup, messageHandler.getMessages)
    .post('/:groupId/messages', groupHandler.authenticateGroup, messageHandler.createMessage) // @deprecated
    .get('/:groupId/members', groupHandler.authenticateGroup, groupHandler.getMembers)
    .post('/:groupId/members', groupHandler.authenticateGroup, groupHandler.addMember) // @deprecated
    .put('/:groupId/seen', groupHandler.authenticateGroup, groupHandler.updateSeen)
    .post('/messages', multer().single('image'), groupHandler.createOrAuthenticateGroup, messageHandler.createMessage);
