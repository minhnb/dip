'use strict';

angular.module('dipApp.report_event_reservations', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/reports/event-reservations', {
            templateUrl: 'reports/event_reservations/event_reservations.html',
            controller: 'ReportEventReservationsController'
        });
    }])

    .controller('ReportEventReservationsController', ['$scope', '$timeout', '$rootScope', '$location', 'reportService',
        function ($scope, $timeout, $rootScope, $location, reportService) {
            $rootScope.isNoMenuPage = false;
            $scope.$parent.pageTitle = "EVENT_RESERVATIONS_REPORT";
            $scope.tableTitle = "LIST_EVENT_RESERVATIONS";
            $scope.headers = ["EMAIL", "NAME", "HOST", "EVENT", "EVENT_TIME", "COUNT", "PRICE", "TAX", "TOTAL", "PURCHASED_DATE"];
            $scope.columns = ["user.username", "user.fullName", "host.displayName", "event.title", "eventTime", "count", "price", "tax", "totalIncludeTax", "purchasedDate"];
            $scope.rows = [];

            $scope.getEventReservationsReport = function () {
                $scope.startSpin();
                reportService.getEventReservationsReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeEventReservationsReportData(data);
                        $scope.stopSpin();
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {
                        $scope.stopSpin();
                    });
            };

            $scope.analyzeEventReservationsReportData = function (list) {
                list.map(function(item) {
                    var startTime = utils.convertMinuteDurationToTime(item.event.duration.startTime);
                    var endTime = utils.convertMinuteDurationToTime(item.event.duration.endTime);
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