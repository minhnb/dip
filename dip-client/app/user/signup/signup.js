'use strict';
angular.module('dipApp.signup', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/signup', {
            templateUrl: 'user/signup/signup.html',
            controller: 'SignUpController'
        });
    }])
    .controller('SignUpController', ['$scope', '$timeout', '$rootScope', '$location', 'userService', 'formValidatorUtils',
        function ($scope, $timeout, $rootScope, $location, userService, formValidatorUtils) {
            $rootScope.isNoMenuPage = true;
            $rootScope.pageTitle = "REGISTER";
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
                $scope.startSpin();
                userService.signUp($scope.user)
                    .success(function (data, status) {
                        userService.login($scope.user.email, $scope.user.password)
                            .success(function (data, status) {
                                $scope.stopSpin();
                                $scope.$parent.initUser();
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
                    $('form input[type="checkbox"]').iCheck({
                        checkboxClass: 'icheckbox_square-blue',
                        radioClass: 'iradio_square-blue',
                        increaseArea: '20%' // optional
                    });
                    $('form input[type="checkbox"]').on('ifChanged', function () {
                        $(this).trigger('change');
                    });
                });
            };

            $scope.initForm = function () {
                $scope.initRememberCheckbox();
                $('form input[type="checkbox"]').attr('data-error', $scope.translate('ERROR_MUST_ACCEPT_TERM'));
                formValidatorUtils.initDIPDefaultFormValidator($('.register-box form'), $scope.signUp);
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