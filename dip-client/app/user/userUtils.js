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
                    return avatar.url;
                }
                return DEFAULT_AVATAR;
            },
            convertUser: function (user) {
                user.fullName = userUtils.getUserFullName(user);
                user.translateRole = userUtils.getUserRole(user.role);
                user.displayCreatedDay = moment(user.createdAt).format(FORMAT_DATE);
                user.avatarUrl = userUtils.getDisplayAvatar(user.avatar);
                if (user.dob) {
                    user.birthday = utils.formatDipDateToDate(user.dob);
                } else {
                    user.birthday = '09/19/1989';
                }
                user.phone = '0903878199';

                return user;
            }
        };
        return userUtils;
    }]);