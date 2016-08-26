'use strict';
angular.module('dipApp.signup', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/signup', {
            templateUrl: 'signup/signup.html',
            controller: 'SignUpController'
        });
    }])
    .controller('SignUpController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
        function ($scope, $timeout, $rootScope, $location, userService) {
            $rootScope.isNoMenuPage = true;
            $scope.user = {};
            $scope.isValidUser = function (user) {
                if (!user.email || !user.firstName || !user.password || !user.confirmPassword) {
                    return;
                }
                if (!utils.isValidEmailAddress(user.email)) {
                    return;
                }
                if (user.password != user.confirmPassword) {
                    return;
                }
                return true;
            };
            $scope.signUp = function () {
                if (!$scope.isValidUser($scope.user)) {
                    return;
                }
                userService.signUp($scope.user)
                    .success(function (data, status) {
                        userService.login($scope.user.email, $scope.user.password)
                            .success(function (data, status) {
                                $location.path('/dashboard');
                            })
                            .error(function (data, status) {
                                $scope.handleError(data);
                            });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
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

            $scope.initForm = function () {
                $scope.initRememberCheckbox();
                $('.register-box form').validator();
                $('.register-box form input:first').focus();
            };

            $scope.init = function () {
                userService.initUser();
                if (userService.user && userService.user.JWT) {
                    $location.path('/dashboard');
                } else {
                    $scope.initForm();
                    $scope.stopSpin();
                }
            };
            $scope.init();
        }]);