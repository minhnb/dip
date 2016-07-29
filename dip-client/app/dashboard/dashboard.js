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
            $scope.$parent.pageTitle = "Dashboard";
            function load_scripts() {
                utils.load_script('adminLTE/dist/js/pages/dashboard2.js');
                // utils.load_script('adminLTE/dist/js/demo.js');
            }

            $scope.init = function () {
                load_scripts();
                console.log($scope.isInitTemplate);
                if (!$scope.isInitTemplate) {
                    $scope.initTemplate();
                }
            };

            $rootScope.initDipApp($scope.init);


        }]);