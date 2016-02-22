'use strict';

const validator = require('../helpers/input_validator');

module.exports = {
    addMember: () => validator({
        request: {
            body: {
                user: validator.isMongoId()
            }
        }
    }),
    removeMember: () => validator({
        params: {
            id: validator.isMongoId()
        }
    })
};