'use strict';

angular.module('dipApp.dashboard', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/dashboard', {
            templateUrl: 'dashboard/dashboard.html',
            controller: 'DashBoardController'
        });
    }])
    .controller('DashBoardController', ['$scope', '$timeout', '$rootScope', '$location',
        function ($scope, $timeout, $rootScope, $location) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "DASHBOARD";
            function load_scripts() {
                utils.load_script('adminLTE/dist/js/pages/dashboard2.js');
                // utils.load_script('adminLTE/dist/js/demo.js');
            }

            $scope.init = function () {
                load_scripts();
                if (!$scope.isInitTemplate) {
                    $scope.initTemplate();
                }
                $scope.stopSpin();
            };
            $location.path('/properties/hotels');
            // $rootScope.initDipApp($scope.init);
        }]);