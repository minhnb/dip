'use strict';

function convertUserReference(user) {
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.name,
        username: user.username,
        picture: user.avatar
    };
}

module.exports = convertUserReference;