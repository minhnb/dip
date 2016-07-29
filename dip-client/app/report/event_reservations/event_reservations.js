'use strict';

angular.module('dipApp.report_event_reservations', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/report/event-reservations', {
            templateUrl: 'report//event_reservations/event_reservations.html',
            controller: 'ReportEventReservationsController'
        });
    }])

    .controller('ReportEventReservationsController', ['$scope', '$timeout', '$rootScope', '$location', 'reportService',
        function ($scope, $timeout, $rootScope, $location, reportService) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "Event Reservations Report";
            $scope.tableTitle = "List Event Reservations";
            $scope.headers = ["Email", "Name", "Host", "Event", "Event Time", "Count", "Price", "Tax", "Total", "Purchased Date"];
            $scope.columns = ["user.username", "user.fullName", "host.displayName", "event.title", "eventTime", "count", "price", "tax", "totalIncludeTax", "purchasedDate"];
            $scope.rows = [];

            $scope.getEventReservationsReport = function () {
                reportService.getEventReservationsReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeEventReservationsReportData(data);
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {

                    });
            };

            $scope.analyzeEventReservationsReportData = function (list) {
                list.map(item => {
                    let startTime = utils.convertMinuteDurationToTime(item.event.duration.startTime);
                    let endTime = utils.convertMinuteDurationToTime(item.event.duration.endTime);
                    item.eventTime = moment(item.event.date).format(FORMAT_DATE) + " " + startTime + " - " + endTime;
                    item.purchasedDate = utils.formatTimeStampToDateTime(item.createdAt);
                });
                return list;
            };

            $scope.init = function () {
                $scope.getEventReservationsReport();
            };

            $rootScope.initDipApp($scope.init);
        }]);