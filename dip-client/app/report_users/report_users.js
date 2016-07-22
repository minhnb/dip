'use strict';

angular.module('dipApp.report_users', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/report/users', {
            templateUrl: 'report_users/report_users.html',
            controller: 'ReportUsersController'
        });
    }])
    .controller('ReportUsersController', ['$scope', '$timeout', '$rootScope', '$location', 'reportService',
        function ($scope, $timeout, $rootScope, $location, reportService) {
            $rootScope.isNoMenuPage = false;
            $scope.pageTitle = "Users Report";
            $scope.tableTitle = "List Users";
            $scope.headers = ["Username", "First Name", "Last Name", "Sign Up Date"];
            $scope.columns = ["username", "firstName", "lastName", "signUpDate"];
            $scope.rows = [];

            $scope.getUsersReport = function () {
                reportService.getUserReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeUserReportData(data);
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {

                    });
            };

            $scope.analyzeUserReportData = function (list) {
                list.map(item => {
                    item.signUpDate = formatTimeStampToDateTime(item.createdAt);
                });
                return list;
            };

            setTimeout(function () {
                $scope.getUsersReport();
            }, 100);
        }]);