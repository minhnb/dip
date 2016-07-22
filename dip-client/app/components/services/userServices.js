dipApp.factory('userService', ['$q', '$http', '$localStorage',
    function ($q, $http, $localStorage) {
        let apiAuthUrl = config.DIP_API + "auth",
            apiUsersUrl = config.DIP_API + "users",
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
                $localStorage.user.info = JSON.stringify(user);
            },
            saveUserAccessTokenToLocalStorage: function (token) {
                if (!$localStorage.user) {
                    $localStorage.user = {};
                }
                $localStorage.user.JWT = "JWT " + token;
            },
            login: function (username, password) {
                if (username && password) {
                    var user = {username: username, password: password};
                    return $http.post(apiAuthUrl + "/login", user)
                        .success(function (data, status, headers, config) {
                            let token = data.JWT;
                            userService.saveUserAccessTokenToLocalStorage(token);
                            userService.getUserInfo();
                        })
                        .error(function (data, status, headers, config) {
                            console.log(status, data);
                        });
                }
            },
            getUserInfo: function () {
                return $http.get(apiUsersUrl + "/me")
                    .success(function (data, status, headers, config) {
                        userService.saveUserToLocalStorage(data);
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            },
            logOut: function () {
                return $http.post(apiAuthUrl + "/logout", {})
                    .success(function (data, status, headers, config) {
                        console.log(status);
                        $localStorage.$reset();
                        userService.user = {
                                info: {},
                                JWT: ""
                            };
                    })
                    .error(function (data, status, headers, config) {
                        console.log(status, data);
                    });
            }
        };
        return userService;
    }]);