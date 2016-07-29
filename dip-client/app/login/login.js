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
                utils.notyErrorMessage('Wrong username or password.Please check and try again.', true);
            };

            $scope.initRememberCheckbox = function () {
                $(function () {
                    $('input').iCheck({
                        checkboxClass: 'icheckbox_square-blue',
                        radioClass: 'iradio_square-blue',
                        increaseArea: '20%' // optional
                    });
                });
            };

            $scope.init = function () {
                userService.initUser();
                if (userService.user && userService.user.JWT) {
                    // console.log("user already login");
                    $location.path('/dashboard');
                } else {
                    $scope.initRememberCheckbox();
                }
            };
            $scope.init();

        }]);