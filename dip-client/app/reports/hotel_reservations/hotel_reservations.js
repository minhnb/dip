'use strict';

angular.module('dipApp.report_hotel_reservations', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/reports/hotel-reservations', {
            templateUrl: 'reports/hotel_reservations/hotel_reservations.html',
            controller: 'ReportHotelReservationsController'
        });
    }])

    .controller('ReportHotelReservationsController', ['$scope', '$timeout', '$rootScope', '$location', '$compile', 'reportService',
        function ($scope, $timeout, $rootScope, $location, $compile, reportService) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "HOTEL_RESERVATIONS_REPORT";
            $scope.tableTitle = "LIST_HOTEL_RESERVATIONS";
            $scope.headers = ["EMAIL", "FULL_NAME", "Hotel", "PASS_DATE", "PURCHASE_DETAILS", "SUB_TOTAL", "TAX", "TOTAL", "PURCHASED_DATE"];
            $scope.columns = ["user.username", "user.fullName", "hotel.name", "passDate", "passes", "beforeTax", "tax", "price", "purchasedDate"];
            $scope.rows = [];

            $scope.getHotelReservationsReport = function () {
                $scope.startSpin();
                reportService.getHotelReservationsReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeHotelReservationsReportData(data);
                        $scope.stopSpin();
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {
                        $scope.stopSpin();
                    });
            };

            $scope.analyzeHotelReservationsReportData = function (list) {
                list.map(function(item) {
                    item.price = utils.displayMoney(item.price);
                    item.tax = utils.displayMoney(item.tax);
                    item.beforeTax = utils.displayMoney(item.beforeTax);
                    item.purchasedDate = utils.formatTimeStampToDateTime(item.createdAt);
                    var passes = "";
                    var passDate = "";
                    var passesArray = [];
                    item.services.map(function(service) {
                        service.offers.map(function (offer) {
                            if (!passDate) {
                                passDate = utils.formatDipDateToDate(offer.date);
                            }
                            offer.price = utils.displayMoney(offer.price);
                            passesArray.push(offer);
                        });
                    });
                    item.passes = passesArray;
                    item.passDate = passDate;
                });
                return list;
            };

            $scope.init = function () {
                $scope.getHotelReservationsReport();
            };

            $rootScope.initDipApp($scope.init);
        }]);