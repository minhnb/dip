'use strict';

var validator = require('../helpers/input_validator');

module.exports = {
    addMember: function addMember() {
        return validator({
            request: {
                body: {
                    user: validator.isMongoId()
                }
            }
        });
    },
    removeMember: function removeMember() {
        return validator({
            params: {
                id: validator.isMongoId()
            }
        });
    }
};