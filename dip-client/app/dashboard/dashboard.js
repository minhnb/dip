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
            $scope.pageTitle = "Dashboard";
            function load_scripts() {
                utils.load_script('components/helper/template/settings.js');
                utils.load_script('joli_template/js/demo_dashboard.js');
            }

            $scope.init = function () {
                load_scripts();
            };

            $rootScope.initDipApp($scope.init);


        }]);