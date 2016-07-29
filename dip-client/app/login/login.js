'use strict';
angular.module('dipApp.login', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/login.html',
            controller: 'LoginController'
        });
    }])
    .controller('LoginController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
        function ($scope, $timeout, $rootScope, $location, userService) {
            $rootScope.isNoMenuPage = true;
            $scope.username = "";
            $scope.password = "";

            $scope.init = function () {
                userService.initUser();
                if (userService.user && userService.user.JWT) {
                    // console.log("user already login");
                    $location.path('/dashboard');
                }
            };
            $scope.init();

            $scope.login = function () {
                if (!$scope.username || !$scope.password) {
                    return;
                }
                userService.login($scope.username, $scope.password)
                    .success(function (data, status) {
                        $location.path('/dashboard');
                    })
                    .error(function (data, status) {
                        $scope.showLoginError();
                    });
            };

            $scope.showLoginError = function () {
                utils.showMessageBoxWithSound('#message-box-sound-login-failed', 'fail');
            };

        }]);