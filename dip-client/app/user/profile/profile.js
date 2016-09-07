'use strict';
angular.module('dipApp.profile', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/user/profile', {
            templateUrl: 'user/profile/profile.html',
            controller: 'ProfileController'
        });
    }])
    .controller('ProfileController', ['$scope', '$timeout', '$rootScope', '$location', 'userService', 'userUtils',
        function ($scope, $timeout, $rootScope, $location, userService, userUtils) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "PROFILE";
            $scope.isShowingUserProfile = false;
            $scope.isEditingProfile = false;
            $scope.user = {};
            $scope.pureUser = {};

            $scope.getUserInfo = function () {
                $scope.startSpin();
                userService.getUserInfo()
                    .success(function (data, status) {
                        $scope.actionAfterLoadUserInfo(data.user);
                        $scope.isShowingUserProfile = true;
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.showEditProfile = function () {
                $scope.startSpin();
                userService.getUserInfo()
                    .success(function (data, status) {
                        $scope.actionAfterLoadUserInfo(data.user);
                        $scope.isEditingProfile = true;
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterLoadUserInfo = function (data) {
                var convertedUser = userUtils.convertUser(data);
                utils.updateObjectInfo($scope.user, convertedUser);
                utils.updateObjectInfo($scope.pureUser, convertedUser);
                utils.updateObjectInfo($scope.$parent.currentUser, convertedUser);
                $('#image_box_profile').trigger('setImage', [$scope.user.avatarUrl, $scope.user.fullName]);
            };

            $scope.hideEditProfile = function () {
                $scope.isEditingProfile = false;
                $('.user-profile form').validator('reset');
            };

            $scope.discardChangeUser = function () {
                utils.updateObjectInfo($scope.user, $scope.pureUser);
                $('#image_box_profile').trigger('setImage', [$scope.user.avatarUrl, $scope.user.fullName]);
                $scope.hideEditProfile();
            };

            $scope.updateUserAvatar = function () {
                var image = $('#image_box_profile > .input-upload-img')[0].files[0];
                return userService.updateUserAvatar(image)
                    .success(function (data, status) {

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.editUser = function () {
                if (!$scope.user.fullName) {
                    return;
                }
                $scope.startSpin();
                var user = {};
                $scope.user.firstName = userUtils.getFirstNameFromFullName($scope.user.fullName);
                $scope.user.lastName = userUtils.getLastNameFromFullName($scope.user.fullName);
                user.firstName = $scope.user.firstName;
                user.lastName = $scope.user.lastName;
                user.phone = $scope.user.phone;
                $scope.user.birthday = $('form input[ng-model="user.birthday"]').val();
                if ($scope.user.birthday) {
                    $scope.user.dob = utils.formatDateToDipDate($scope.user.birthday);
                    user.dob = $scope.user.dob;
                }

                userService.updateUser(user)
                    .success(function (data, status) {
                        if ($('#image_box_profile > .input-upload-img').val()) {
                            $scope.updateUserAvatar(data.id)
                                .success(function (data, status) {
                                    $scope.user.picture.url = data.location;
                                    $scope.actionAfterSaveUserInfo();
                                });
                        } else {
                            $scope.actionAfterSaveUserInfo();
                        }

                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.initChangePasswordModal = function () {
                $('#change_password_modal form').validator('reset');
                $('#change_password_modal input').val('');
            };

            $scope.changePassword = function () {
                if (!$scope.password || !$scope.newPassword || $scope.newPassword != $scope.confirmPassword) {
                    return;
                }
                var user = {
                    oldPassword: $scope.password,
                    newPassword: $scope.newPassword
                };
                userService.updateUser(user)
                    .success(function (data, status) {
                        $('#change_password_modal').modal('hide');
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.actionAfterSaveUserInfo = function () {
                $scope.stopSpin();
                $scope.actionAfterLoadUserInfo($scope.user);
                $scope.hideEditProfile();
            };

            $scope.init = function () {
                $scope.getUserInfo();
                $('.user-birthday').datepicker({
                    format: FORMAT_DATE_BOOTSTRAP_CALENDAR,
                    zIndexOffset: 1050,
                    endDate: moment(new Date()).format(FORMAT_DATE)
                });
                $('.user-profile form').validator().off('focusout.bs.validator input.bs.validator').on('submit', function (e) {
                    userUtils.handleSubmitForm(e, $scope.editUser);
                });
                $('#change_password_modal form').validator().off('focusout.bs.validator input.bs.validator').on('submit', function (e) {
                    userUtils.handleSubmitForm(e, $scope.changePassword);
                });
            };

            $rootScope.initDipApp($scope.init);
        }]);