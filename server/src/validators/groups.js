'use strict';

const validator = require('../helpers/input_validator');

const dipErrorDictionary = require('../constants/dipErrorDictionary');
const DIPError = require('../helpers/DIPError');

module.exports = {
    addGroup: () => validator({
        request: {
            body: {
                name: validator.optional(validator.isLength({max: 20})),
                description: validator.optional(validator.isLength({max: 255})),
                members: data => {
                    if (data === null || data === undefined) {
                        return true;
                    } else if (!Array.isArray(data)) {
                        // throw Error('Members must be an array');
                        throw new DIPError(dipErrorDictionary.MEMBERS_MUST_BE_ARRAY);
                    } else {
                        data.forEach(m => {
                            // TODO: Consideration: Switch to koa-validate for a more-minimal lib
                            // (minimal in the sense that it only provides validator functions
                            //    and doesn't get in the way of how/what we want to do with it)
                            if (!validator.isMongoId()(m).value) {
                                // throw new Error('Invalid member id');
                                throw new DIPError(dipErrorDictionary.INVALID_MEMBER_ID);
                            }
                        });
                        return true;
                    }
                }
            }
        }
    }),
    seenMessage: () => validator({
        request: {
            body: {
                lastMessage: validator.isMongoId()
            }
        }
    }),
    updateGroup: () => validator({
        request: {
            body: {
                name: validator.optional(validator.isLength({max: 20})),
                description: validator.optional(validator.isLength({max: 255})),
                group: validator.isMongoId(),
                members: data => {
                    if (data === null || data === undefined) {
                        return true;
                    } else if (!Array.isArray(data)) {
                        // throw Error('Members must be an array');
                        throw new DIPError(dipErrorDictionary.MEMBERS_MUST_BE_ARRAY);
                    } else {
                        data.forEach(m => {
                            // TODO: Consideration: Switch to koa-validate for a more-minimal lib
                            // (minimal in the sense that it only provides validator functions
                            //    and doesn't get in the way of how/what we want to do with it)
                            if (!validator.isMongoId()(m.member).value) {
                                // throw new Error('Invalid member id');
                                throw new DIPError(dipErrorDictionary.INVALID_MEMBER_ID);
                            }
                            if(!m.lastMessage) {
                                // throw new Error('Missing last message');
                                throw new DIPError(dipErrorDictionary.MISSING_LAST_MESSAGE);
                            }
                        });
                        return true;
                    }
                }
            }
        }
    })
};