'use strict';
angular.module('dipApp.login', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'user/login/login.html',
            controller: 'LoginController'
        });
    }])
    .controller('LoginController', ['$scope', '$timeout', '$rootScope', '$location', 'userService', 'userUtils',
        function ($scope, $timeout, $rootScope, $location, userService, userUtils) {
            $rootScope.isNoMenuPage = true;
            $rootScope.pageTitle = "LOGIN";
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
                $scope.startSpin();
                userService.login($scope.username, $scope.password)
                    .success(function (data, status) {
                        $scope.stopSpin();
                        $scope.$parent.initUser()
                            .success(function (data, status) {
                                if (data.user.role == config.ROLE) {
                                    $location.path('/dashboard');
                                } else {
                                    userService.logOut().then(function () {
                                        $scope.notifyValidateError('UNAUTHORIZED');
                                    });
                                }
                            })
                            .error(function (data, status) {
                                $scope.handleError(data);
                            });
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.sendEmail = function () {
                if (!$scope.email || !utils.isValidEmailAddress($scope.email)) {
                    return;
                }
                $scope.startSpin();
                userService.sendResetPasswordTokenToEmail($scope.email)
                    .success(function (data, status) {
                        $scope.stopSpin();
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
                $scope.startSpin();
                userService.resetPassword($scope.token, $scope.newPassword)
                    .success(function (data, status) {
                        $scope.stopSpin();
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