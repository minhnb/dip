'use strict';

function dipChat() {
    return process.env.NODE_ENV == 'production' ? '56e7de25e83767f84a923e79': '56e7de25e83767f84a923e79';
}

module.exports = {
    dipChat: dipChat
};