dipApp.factory('userService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        var apiAuthUrl = config.DIP_API + "auth",
            apiUsersUrl = config.DIP_API + "users",
            apiResetPasswordUrl = config.DIP_API + "resetpassword",
            userService = {};
        userService = {
            user: {
                info: {},
                JWT: ""
            },
            initUser: function (localUser) {
                if (!localUser) {
                    if ($localStorage.user == undefined) {
                        userService.user = {
                            info: {},
                            JWT: ""
                        };
                        return;
                    }
                    else {
                        userService.user = $localStorage.user;
                    }
                } else {
                    userService.user = localUser;
                    $localStorage.user = localUser;
                }
            },
            saveUserToLocalStorage: function (user) {
                if (!$localStorage.user) {
                    $localStorage.user = {};
                }
                $localStorage.user.info = user;
            },
            saveUserAccessTokenToLocalStorage: function (token) {
                if (!$localStorage.user) {
                    $localStorage.user = {};
                }
                $localStorage.user.JWT = "JWT " + token;
            },
            clear: function () {
                $localStorage.$reset();
                userService.user = {
                    info: {},
                    JWT: ""
                };
            },
            login: function (username, password) {
                if (username && password) {
                    var user = {username: username, password: password, role: config.ROLE};
                    return $http.post(apiAuthUrl + "/login", user)
                        .success(function (data, status, headers, config) {
                            var token = data.JWT;
                            userService.saveUserAccessTokenToLocalStorage(token);
                        });
                }
            },
            getUserInfo: function () {
                return $http.get(apiUsersUrl + "/me")
                    .success(function (data, status, headers, config) {
                        userService.saveUserToLocalStorage(data.user);
                    });
            },
            logOut: function () {
                return $http.post(apiAuthUrl + "/logout", {})
                    .success(function (data, status, headers, config) {
                        userService.clear();
                    });
            },
            signUp: function (user) {
                user.role = config.ROLE;
                if (!user.gender) {
                    user.gender = 'na';
                }
                return $http.post(apiAuthUrl + "/signup", user);
            },
            sendResetPasswordTokenToEmail: function (email) {
                return $http.post(apiResetPasswordUrl, {email: email});
            },
            resetPassword: function (token, password) {
                return $http.put(apiResetPasswordUrl + "/" + token, {password: password});
            },
            updateUser: function (user) {
                return $http.put(apiUsersUrl + "/me", {user: user});
            },
            updateUserAvatar: function (image) {
                var fd = new FormData();
                fd.append('image', image);
                return $http.put(apiUsersUrl + "/me/avatar", fd,
                    {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    });
            }
        };
        return userService;
    }]);