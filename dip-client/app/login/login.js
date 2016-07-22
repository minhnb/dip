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
                    console.log("user already login");
                    $location.path('/dashboard');
                }
            };
            $scope.init();

            $scope.login = function () {
                console.log($scope.username, $scope.password);
                if (!$scope.username || !$scope.password) {
                    return;
                }
                userService.login($scope.username, $scope.password)
                    .success(function (data, status) {
                        console.log(data, status);
                        $location.path('/dashboard');
                    })
                    .error(function (data, status) {
                        console.log(data, status);
                        $scope.showLoginError();
                    });
            };

            $scope.showLoginError = function () {
                showMessageBoxWithSound('#message-box-sound-login-failed', 'fail');
                // document.getElementById('audio-fail').play();
                // $("#message-box-sound-login-failed .mb-control-close").on("click",function(){
                //     $(this).parents(".message-box").removeClass("open");
                //     return false;
                // });
                // $('#message-box-sound-login-failed').toggleClass("open");
            };




        }]);