'use strict';

angular.module('dipApp.report_users', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/reports/users', {
            templateUrl: 'reports/users/users.html',
            controller: 'ReportUsersController'
        });
    }])
    .controller('ReportUsersController', ['$scope', '$timeout', '$rootScope', '$location', 'reportService',
        function ($scope, $timeout, $rootScope, $location, reportService) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "USERS_REPORT";
            $scope.tableTitle = "LIST_USERS";
            $scope.headers = ["EMAIL", "NAME", "BIRTHDAY", "MEMBERSHIP", "SIGN_UP_DATE"];
            $scope.columns = ["username", "fullName", "birthday", "membership.type.name", "signUpDate"];
            $scope.rows = [];

            $scope.getUsersReport = function () {
                $scope.startSpin();
                reportService.getUserReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeUserReportData(data);
                        $scope.stopSpin();
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {
                        $scope.stopSpin();
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