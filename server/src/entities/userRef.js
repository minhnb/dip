'use strict';

function convertUserReference(user) {
    return {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        picture: user.avatar
    };
}

module.exports = convertUserReference;