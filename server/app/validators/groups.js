'use strict';

var validator = require('../helpers/input_validator');

module.exports = {
    addGroup: function addGroup() {
        return validator({
            request: {
                body: {
                    name: validator.optional(validator.isLength({ max: 20 })),
                    description: validator.optional(validator.isLength({ max: 255 })),
                    members: function members(data) {
                        if (data === null || data === undefined) {
                            return true;
                        } else if (!Array.isArray(data)) {
                            throw Error('Members must be an array');
                        } else {
                            data.forEach(function (m) {
                                // TODO: Consideration: Switch to koa-validate for a more-minimal lib
                                // (minimal in the sense that it only provides validator functions
                                //    and doesn't get in the way of how/what we want to do with it)
                                if (!validator.isMongoId()(m).value) {
                                    throw new Error('Invalid member id');
                                }
                            });
                            return true;
                        }
                    }
                }
            }
        });
    },
    updateGroup: function updateGroup() {
        return validator({
            request: {
                body: {
                    name: validator.optional(validator.isLength({ max: 20 })),
                    description: validator.optional(validator.isLength({ max: 255 }))
                }
            }
        });
    }
};