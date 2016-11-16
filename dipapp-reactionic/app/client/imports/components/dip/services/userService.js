import DFetch from './dFetch';
import AppConfig from '../../../constant/appConfigs';

var apiAuthUrl = AppConfig.DIP_API + "auth",
    apiUsersUrl = AppConfig.DIP_API + "users",
    apiResetPasswordUrl = AppConfig.DIP_API + "resetpassword";

var UserService = {
    login: function (username, password) {
        if (username && password) {
            var user = {username: username, password: password};
            return DFetch.post(apiAuthUrl + "/login", user)
                .then(function (res) {
                    var token = res.JWT;
                    // userService.saveUserAccessTokenToLocalStorage(token);
                    return res;
                });
        }
    },
    fbLogin: function (accessToken) {
        if (accessToken) {
            var user = {code: accessToken};
            return DFetch.post(apiAuthUrl + "/fblogin", user)
                .then(function (res) {
                    var token = res.JWT;
                    // userService.saveUserAccessTokenToLocalStorage(token);
                    return res;
                });
        }
    },
    getUserInfo: function () {
        return DFetch.get(apiUsersUrl + "/me")
            .then(function (res) {
                // userService.saveUserToLocalStorage(res.user);
                return res;
            });
    },
    logOut: function () {
        return DFetch.post(apiAuthUrl + "/logout", {})
            .then(function (res) {
                // userService.clear();
                return res;
            });
    },
    signUp: function (user) {
        if (!user.gender) {
            user.gender = 'na';
        }
        return DFetch.post(apiAuthUrl + "/signup", user);
    },
    sendResetPasswordTokenToEmail: function (email) {
        return DFetch.post(apiResetPasswordUrl, {email: email});
    },
    resetPassword: function (token, password) {
        return DFetch.put(apiResetPasswordUrl + "/" + token, {password: password});
    },
    updateUser: function (user) {
        return DFetch.put(apiUsersUrl + "/me", {user: user});
    },
    updateUserAvatar: function (image) {
        var fd = new FormData();
        fd.append('image', image);
        return DFetch.put(apiUsersUrl + "/me/avatar", fd,
            {
                // transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            });
    },
    getConfigs: function () {
        return DFetch.get(AppConfig.DIP_API + 'configs');
    }
};

export default UserService;