'use strict';
angular.module('dipApp.login', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'user/login/login.html',
            controller: 'LoginController'
        });
    }])
    .controller('LoginController', ['$scope', '$timeout', '$rootScope', '$location', 'userService',
        function ($scope, $timeout, $rootScope, $location, userService) {
            $rootScope.isNoMenuPage = true;
            $scope.username = "";
            $scope.password = "";
            $scope.email = "";
            $scope.token = "";
            $scope.newPassword = "";
            $scope.confirmPassword = "";
            $scope.alreadyHasToken = false;

            $scope.login = function () {
                if (!$scope.username || !$scope.password) {
                    return;
                }
                userService.login($scope.username, $scope.password)
                    .success(function (data, status) {
                        $scope.$parent.initUser();
                        $location.path('/dashboard');
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.sendEmail = function () {
                if (!$scope.email || !utils.isValidEmailAddress($scope.email)) {
                    return;
                }
                userService.sendResetPasswordTokenToEmail($scope.email)
                    .success(function (data, status) {
                        utils.notySuccessMessage($scope.translate('RESET_PASSWORD_CHECK_EMAIL', true));
                        $scope.alreadyHasToken = true;
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.resetPassword = function () {
                if (!$scope.token || !$scope.newPassword || $scope.newPassword != $scope.confirmPassword) {
                    return;
                }
                userService.resetPassword($scope.token, $scope.newPassword)
                    .success(function (data, status) {
                        utils.notySuccessMessage($scope.translate('RESET_PASSWORD_SUCCESSFULLY', true));
                        $('#forgot_password_modal').modal('hide');
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

            $scope.showEmailForm = function () {
                $scope.alreadyHasToken = false;
                $scope.modalResetPasswordSetFocus();
            };

            $scope.showResetPasswordForm = function () {
                $scope.alreadyHasToken = true;
                $scope.modalResetPasswordSetFocus();
            };

            $scope.modalResetPasswordSetFocus = function () {
                setTimeout(function () {
                    if ($scope.alreadyHasToken) {
                        $('.modal form:last input:first').focus();
                    } else {
                        $('.modal form:first input:first').focus();
                    }
                }, 500);
            };

            $scope.initForm = function () {
                $scope.initRememberCheckbox();
                $('.login-box form').validator().off('focusout.bs.validator');
                $('.login-box-body form input:first').focus();
            };

            $scope.init = function () {
                userService.initUser();
                if (userService.user && userService.user.JWT) {
                    // console.log("user already login");
                    $location.path('/dashboard');
                } else {
                    $scope.initForm();
                    $scope.stopSpin();
                }
            };
            $scope.init();

        }]);