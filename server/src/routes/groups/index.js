'use strict';

const router = require('koa-router')();

const db = require('../../db');
const validator = require('../../validators');
const entities = require('../../entities');
const auth = require('../../helpers/passport_auth');
const contactDip = require('../../helpers/contact_dip');

const groupHandler = require('./group.handler');
const messageHandler = require('./message.handler');

module.exports = router;

router.use('/', auth.authenticate())
    .get('/',
        validator.limitParams(),
        groupHandler.getGroups
    )
    .post('/contactdip', groupHandler.contactDip)
    .get('/:groupId', groupHandler.authenticateGroup, groupHandler.getGroup)
    .get('/:groupId/messages', groupHandler.authenticateGroup, messageHandler.getMessages)
    .get('/:groupId/members', groupHandler.authenticateGroup, groupHandler.getMembers)
    .put('/:groupId/seen', groupHandler.authenticateGroup, groupHandler.updateSeen)
    .post('/messages', groupHandler.createOrAuthenticateGroup, messageHandler.createMessage)
