'use strict';

angular.module('dipApp.report_users', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/report/users', {
            templateUrl: 'report/users/users.html',
            controller: 'ReportUsersController'
        });
    }])
    .controller('ReportUsersController', ['$scope', '$timeout', '$rootScope', '$location', 'reportService',
        function ($scope, $timeout, $rootScope, $location, reportService) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "Users Report";
            $scope.tableTitle = "List Users";
            $scope.headers = ["Email", "Name", "Birthday", "Membership", "Sign Up Date"];
            $scope.columns = ["username", "fullName", "birthday", "membership.type.name", "signUpDate"];
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
                list.map(function(item) {
                    item.signUpDate = utils.formatTimeStampToDateTime(item.createdAt);
                    if (item.dob) {
                        item.birthday = utils.formatDipDateToDate(item.dob);
                    } else {
                        item.birthday = '';
                    }
                });
                return list;
            };

            $scope.init = function () {
                $scope.getUsersReport();
            };

            $rootScope.initDipApp($scope.init);
        }]);