dipApp.factory('userUtils', [
    function () {
        var userUtils = {
            getUserFullName: function (user) {
                if (!user) {
                    return '';
                }
                var listNames = [user.firstName, user.lastName];
                return listNames.filter(Boolean).join(' ');
            },
            getUserRole: function (role) {
                switch (role) {
                    case ROLE_ADMIN:
                        return 'DIP_ADMIN';
                    case ROLE_PARTNER:
                        return 'DIP_PARTNER';
                    default:
                        return 'DIP_USER';
                }
            },
            getDisplayAvatar: function (avatar) {
                if (avatar && avatar.url) {
                    var tQuery = 't=' + (new Date()).getTime();
                    if (avatar.url.indexOf('?') > -1) {
                        tQuery = '&' + tQuery;
                    } else {
                        tQuery = '?' + tQuery;
                    }
                    return avatar.url + tQuery;
                }
                return DEFAULT_AVATAR;
            },
            getFirstNameFromFullName: function (fullName) {
                var names = fullName.split(' ').filter(Boolean);
                if (names.length > 1) {
                    names.pop();
                }
                return names.join(' ');
            },
            getLastNameFromFullName: function (fullName) {
                var names = fullName.split(' ').filter(Boolean);
                if (names.length > 1) {
                    return names[names.length - 1];
                }
                return '';
            },
            convertUser: function (user) {
                user.fullName = userUtils.getUserFullName(user);
                user.translateRole = userUtils.getUserRole(user.role);
                user.displayCreatedDay = utils.formatDipDateToDate(user.createdAt);
                user.avatarUrl = userUtils.getDisplayAvatar(user.picture);
                if (user.dob) {
                    user.birthday = utils.formatDipDateToDate(user.dob);
                } else {
                    user.birthday = '';
                }

                return user;
            }
        };
        return userUtils;
    }]);