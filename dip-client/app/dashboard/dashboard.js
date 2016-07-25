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
            $rootScope.pageTitle = "Dashboard";
            function load_scripts() {
                load_script('joli_template/js/plugins.js');
                load_script('joli_template/js/demo_dashboard.js');
            }

            load_scripts();
        }]);