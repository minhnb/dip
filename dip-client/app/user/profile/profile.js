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
            $scope.$parent.pageTitle = "PROFILE";
            $scope.isShowingUserProfile = false;

            $scope.getUserInfo = function () {
                userService.getUserInfo()
                    .success(function (data, status) {
                        $scope.user = userUtils.convertUser(data.user);
                        $scope.$parent.currentUser = $scope.user;
                        $scope.isShowingUserProfile = true;
                        $scope.stopSpin();
                    })
                    .error(function (data, status) {
                        $scope.handleError(data);
                    });
            };

            $scope.init = function () {
                $scope.getUserInfo();
                // setTimeout(function () {
                //     $scope.$apply();
                // }, 0);
            };

            $rootScope.initDipApp($scope.init);
        }]);